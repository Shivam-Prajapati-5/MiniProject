import assert from "node:assert/strict";
import http from "node:http";
import { after, afterEach, before, describe, test } from "node:test";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-characters";
process.env.CLIENT_ORIGIN = "http://localhost:5173";

const { default: app } = await import("../app.js");
const { createSocketServer } = await import("../realtime/socket.js");
const { io: createClient } = await import("socket.io-client");

let mongoServer;
let httpServer;
let ioServer;
let socketUrl;
const openClients = new Set();

const waitForEvent = (emitter, event, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for "${event}"`));
        }, timeoutMs);

        const onEvent = (...args) => {
            cleanup();
            resolve(args);
        };

        const onError = (error) => {
            cleanup();
            reject(error instanceof Error ? error : new Error(String(error)));
        };

        const cleanup = () => {
            clearTimeout(timer);
            emitter.off(event, onEvent);
            emitter.off("connect_error", onError);
        };

        emitter.once(event, onEvent);
        emitter.once("connect_error", onError);
    });
};

const cookieHeader = (response) => {
    return (response.headers["set-cookie"] || [])
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
};

let userNumber = 0;

const registerUser = async () => {
    userNumber += 1;
    const agent = request.agent(app);
    const data = {
        fullname: `Socket User ${userNumber}`,
        username: `socket_user_${userNumber}`,
        email: `socket_user_${userNumber}@example.com`,
        gender: "male",
        password: "secret123",
        securityAnswers: [
            { questionId: "first_pet", answer: "Rex" },
            { questionId: "birth_city", answer: "Mumbai" }
        ]
    };

    const response = await agent.post("/api/auth/register").send(data);
    assert.equal(response.status, 201, JSON.stringify(response.body));

    return {
        agent,
        data,
        id: response.body._id,
        cookie: cookieHeader(response)
    };
};

const connectSocket = async (cookie) => {
    const client = createClient(socketUrl, {
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
        extraHeaders: cookie ? { Cookie: cookie } : {}
    });

    openClients.add(client);
    client.once("disconnect", () => openClients.delete(client));

    return client;
};

const connectSocketWithToken = async (token) => {
    const client = createClient(socketUrl, {
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
        auth: { token }
    });

    openClients.add(client);
    client.once("disconnect", () => openClients.delete(client));

    return client;
};

const waitForPresence = (client, userId, online, timeoutMs = 5000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("Timed out waiting for presence update"));
        }, timeoutMs);

        const onPresence = (payload) => {
            if (
                payload.userId === String(userId) &&
                payload.online === online
            ) {
                cleanup();
                resolve(payload);
            }
        };

        const onError = (error) => {
            cleanup();
            reject(error);
        };

        const cleanup = () => {
            clearTimeout(timer);
            client.off("presence:update", onPresence);
            client.off("connect_error", onError);
        };

        client.on("presence:update", onPresence);
        client.on("connect_error", onError);
    });
};

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    httpServer = http.createServer(app);
    ioServer = createSocketServer(httpServer);

    await new Promise((resolve) => {
        httpServer.listen(0, "127.0.0.1", resolve);
    });

    socketUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
    await new Promise((resolve) => ioServer.close(resolve));
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    for (const client of openClients) {
        client.close();
    }
    openClients.clear();

    await Promise.all(
        Object.values(mongoose.connection.collections)
            .map((collection) => collection.deleteMany({}))
    );
});

describe("Realtime API", () => {
    test("rejects unauthenticated socket connections", async () => {
        const client = await connectSocket(null);

        const [error] = await waitForEvent(client, "connect_error");

        assert.match(error.message, /authentication required/i);
        client.close();
    });

    test("delivers new messages, typing state, and presence", async () => {
        const sender = await registerUser();
        const receiver = await registerUser();

        const senderSocket = await connectSocket(sender.cookie);
        const receiverSocket = await connectSocket(receiver.cookie);

        await Promise.all([
            waitForEvent(senderSocket, "connect"),
            waitForEvent(receiverSocket, "connect")
        ]);

        const messageEvent = waitForEvent(receiverSocket, "message:new");
        const send = await sender.agent
            .post(`/api/message/send/${receiver.id}`)
            .send({ message: "Hello over sockets" });

        assert.equal(send.status, 201, JSON.stringify(send.body));

        const [payload] = await messageEvent;

        assert.equal(payload.message.message, "Hello over sockets");
        assert.equal(payload.message.senderId, sender.id);
        assert.equal(payload.message.reciverId, receiver.id);
        assert.equal(
            payload.conversationId,
            String(send.body.data.conversationId)
        );

        const typingEvent = waitForEvent(receiverSocket, "typing:update");
        senderSocket.emit("typing:start", {
            conversationId: payload.conversationId
        });

        const [typing] = await typingEvent;
        assert.equal(typing.userId, sender.id);
        assert.equal(typing.typing, true);
        assert.equal(typing.conversationId, payload.conversationId);

        const typingStoppedEvent = waitForEvent(
            receiverSocket,
            "typing:update"
        );
        senderSocket.emit("typing:stop", {
            conversationId: payload.conversationId
        });

        const [typingStopped] = await typingStoppedEvent;
        assert.equal(typingStopped.typing, false);

        senderSocket.close();
        receiverSocket.close();
    });

    test("authenticates with a short-lived socket token and rejects it after a reset", async () => {
        const user = await registerUser();
        const tokenResponse = await user.agent.get("/api/auth/socket-token");

        assert.equal(tokenResponse.status, 200, JSON.stringify(tokenResponse.body));
        assert.equal(typeof tokenResponse.body.token, "string");

        const socketToken = tokenResponse.body.token;
        const socket = await connectSocketWithToken(socketToken);
        await waitForEvent(socket, "connect");
        socket.close();

        const reset = await request(app)
            .post("/api/auth/recovery/reset")
            .send({
                email: user.data.email,
                newPassword: "new-secret-123",
                securityAnswers: user.data.securityAnswers
            });

        assert.equal(reset.status, 200, JSON.stringify(reset.body));

        const staleSocket = await connectSocketWithToken(socketToken);
        const [staleError] = await waitForEvent(staleSocket, "connect_error");

        assert.match(staleError.message, /authentication required/i);
        staleSocket.close();
    });

    test("broadcasts presence changes to connected users", async () => {
        const first = await registerUser();
        const second = await registerUser();

        const firstSocket = await connectSocket(first.cookie);
        await waitForEvent(firstSocket, "connect");

        const onlineEvent = waitForPresence(firstSocket, second.id, true);
        const secondSocket = await connectSocket(second.cookie);
        await waitForEvent(secondSocket, "connect");

        const online = await onlineEvent;
        assert.equal(online.userId, second.id);
        assert.equal(online.online, true);

        const offlineEvent = waitForPresence(firstSocket, second.id, false);
        secondSocket.close();

        const offline = await offlineEvent;
        assert.equal(offline.userId, second.id);
        assert.equal(offline.online, false);

        firstSocket.close();
    });

    test("invalidates live sockets and old cookies after a password reset", async () => {
        const user = await registerUser();
        const socket = await connectSocket(user.cookie);

        const connected = waitForEvent(socket, "connect");
        const presence = waitForEvent(socket, "presence:state");

        await connected;
        await presence;

        const disconnected = waitForEvent(socket, "disconnect");
        const reset = await request(app)
            .post("/api/auth/recovery/reset")
            .send({
                email: user.data.email,
                newPassword: "new-secret-123",
                securityAnswers: user.data.securityAnswers
            });

        assert.equal(reset.status, 200, JSON.stringify(reset.body));

        const [reason] = await disconnected;
        assert.equal(reason, "io server disconnect");

        const staleSocket = await connectSocket(user.cookie);
        const [staleError] = await waitForEvent(staleSocket, "connect_error");

        assert.match(staleError.message, /authentication required/i);
        staleSocket.close();

        const staleRequest = await request(app)
            .get("/api/auth/me")
            .set("Cookie", user.cookie);

        assert.equal(staleRequest.status, 401);
    });
});
