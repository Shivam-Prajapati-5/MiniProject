import assert from "node:assert/strict";
import { after, afterEach, before, describe, test } from "node:test";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-characters";
process.env.CLIENT_ORIGIN = "http://localhost:5173";

const { default: app } = await import("../app.js");
const { default: User } = await import("../Modes/useModels.js");
const { default: Conversation } = await import("../Modes/conversationModels.js");
const { default: Message } = await import("../Modes/messageSchema.js");

let mongoServer;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await Promise.all([
        User.init(),
        Conversation.init(),
        Message.init()
    ]);
});

after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Promise.all(
        Object.values(mongoose.connection.collections)
            .map((collection) => collection.deleteMany({}))
    );
});

let userNumber = 0;

const makeUser = (overrides = {}) => {
    userNumber += 1;

    return {
        fullname: `Test User ${userNumber}`,
        username: `test_user_${userNumber}`,
        email: `test_user_${userNumber}@example.com`,
        gender: "male",
        password: "secret123",
        securityAnswers: [
            { questionId: "first_pet", answer: "Rex" },
            { questionId: "birth_city", answer: "Mumbai" },
            { questionId: "first_school", answer: "Greenwood High" }
        ],
        ...overrides
    };
};

const createUser = async (overrides = {}) => {
    const agent = request.agent(app);
    const data = makeUser(overrides);
    const response = await agent
        .post("/api/auth/register")
        .send(data);

    assert.equal(response.status, 201, JSON.stringify(response.body));

    return {
        agent,
        data,
        id: response.body._id,
        response
    };
};

const createConversation = async () => {
    const sender = await createUser();
    const receiver = await createUser();
    const response = await sender.agent
        .post(`/api/message/send/${receiver.id}`)
        .send({ message: "Hello!" });

    assert.equal(response.status, 201, JSON.stringify(response.body));

    return {
        sender,
        receiver,
        conversationId: response.body.data.conversationId
    };
};

describe("Auth API", () => {
    test("registers a user and sets an HttpOnly auth cookie", async () => {
        const data = makeUser({
            fullname: "Ada Lovelace",
            username: "ada_lovelace",
            email: "ada_lovelace@example.com"
        });
        const agent = request.agent(app);

        const response = await agent
            .post("/api/auth/register")
            .send(data);

        assert.equal(response.status, 201);
        assert.equal(response.body.success, true);
        assert.equal(response.body.email, data.email);
        assert.equal(response.body.username, data.username);
        assert.equal(response.body.password, undefined);
        assert.ok(response.body._id);

        const setCookie = response.headers["set-cookie"];
        assert.ok(setCookie);

        const cookieHeader = setCookie.join("; ");
        assert.match(cookieHeader, /jwt=/);
        assert.match(cookieHeader, /HttpOnly/i);
        assert.match(cookieHeader, /SameSite=Strict/i);
        assert.doesNotMatch(cookieHeader, /;\s*Secure/i);

        const me = await agent.get("/api/auth/me");
        assert.equal(me.status, 200);
        assert.equal(me.body.user.username, data.username);
        assert.equal(me.body.user.password, undefined);
        assert.equal(me.body.user.email, data.email);
    });

    test("issues a short-lived socket token only for authenticated users", async () => {
        const unauthenticated = await request(app).get("/api/auth/socket-token");
        assert.equal(unauthenticated.status, 401);

        const user = await createUser();
        const response = await user.agent.get("/api/auth/socket-token");

        assert.equal(response.status, 200, JSON.stringify(response.body));
        assert.equal(response.body.success, true);
        assert.equal(typeof response.body.token, "string");
        assert.ok(response.body.token.length > 20);
        assert.equal(response.body.expiresIn, 300);
        assert.equal(response.headers["cache-control"], "no-store");

        // A handshake token must not double as a browser session cookie.
        const asCookie = await request(app)
            .get("/api/auth/me")
            .set("Cookie", `jwt=${response.body.token}`);

        assert.equal(asCookie.status, 401);
    });

    test("rejects duplicate usernames and emails", async () => {
        const existing = await createUser();

        const duplicateUsername = await request(app)
            .post("/api/auth/register")
            .send(makeUser({ username: existing.data.username }));

        assert.equal(duplicateUsername.status, 400);
        assert.equal(duplicateUsername.body.message, "Username Already Exists");

        const duplicateEmail = await request(app)
            .post("/api/auth/register")
            .send(makeUser({ email: existing.data.email }));

        assert.equal(duplicateEmail.status, 400);
        assert.equal(duplicateEmail.body.message, "Email Already Exists");
    });

    test("validates registration input", async () => {
        const base = makeUser();

        const shortPassword = await request(app)
            .post("/api/auth/register")
            .send({ ...base, password: "123" });

        assert.equal(shortPassword.status, 400);
        assert.match(shortPassword.body.message, /at least 6 characters/i);

        const invalidEmail = await request(app)
            .post("/api/auth/register")
            .send({ ...makeUser(), email: "not-an-email" });

        assert.equal(invalidEmail.status, 400);
        assert.match(invalidEmail.body.message, /valid email address/i);

        const invalidUsername = await request(app)
            .post("/api/auth/register")
            .send({ ...makeUser(), username: "ab" });

        assert.equal(invalidUsername.status, 400);
        assert.match(invalidUsername.body.message, /3-30 characters/i);

        const missingFields = await request(app)
            .post("/api/auth/register")
            .send({});

        assert.equal(missingFields.status, 400);
        assert.equal(missingFields.body.message, "Please provide all required fields");
    });

    test("logs in, normalizes email, and rejects bad credentials generically", async () => {
        const user = await createUser();
        const loginAgent = request.agent(app);

        const login = await loginAgent
            .post("/api/auth/login")
            .send({
                email: `  ${user.data.email.toUpperCase()}  `,
                password: user.data.password
            });

        assert.equal(login.status, 200);
        assert.equal(login.body.success, true);
        assert.equal(login.body.username, user.data.username);
        assert.equal(login.body.password, undefined);
        assert.ok(login.headers["set-cookie"]);

        const wrongPassword = await request(app)
            .post("/api/auth/login")
            .send({
                email: user.data.email,
                password: "wrong-password"
            });

        assert.equal(wrongPassword.status, 401);
        assert.equal(wrongPassword.body.message, "Invalid email or password");

        const unknownEmail = await request(app)
            .post("/api/auth/login")
            .send({
                email: "unknown@example.com",
                password: "secret123"
            });

        assert.equal(unknownEmail.status, 401);
        assert.equal(unknownEmail.body.message, "Invalid email or password");
    });

    test("logs out and clears the session", async () => {
        const user = await createUser();

        const logout = await user.agent.post("/api/auth/logout");

        assert.equal(logout.status, 200);
        assert.equal(logout.body.message, "Logged out successfully");

        const me = await user.agent.get("/api/auth/me");
        assert.equal(me.status, 401);
    });

    test("returns paginated public user data without private fields", async () => {
        const currentUser = await createUser();
        const firstOther = await createUser();
        await createUser();

        const me = await currentUser.agent.get("/api/auth/me");
        assert.equal(me.status, 200);
        assert.equal(me.body.user._id, currentUser.id);

        const users = await currentUser.agent
            .get("/api/auth/users")
            .query({ limit: 1, page: 1 });

        assert.equal(users.status, 200);
        assert.equal(users.body.users.length, 1);
        assert.equal(users.body.pagination.total, 2);
        assert.equal(users.body.pagination.hasMore, true);

        for (const user of users.body.users) {
            assert.equal(user.email, undefined);
            assert.equal(user.gender, undefined);
            assert.equal(user.password, undefined);
        }

        const search = await currentUser.agent
            .get("/api/auth/users")
            .query({ search: firstOther.data.username });

        assert.equal(search.status, 200);
        assert.equal(search.body.pagination.total, 1);
        assert.equal(search.body.users[0].username, firstOther.data.username);
    });

    test("exposes a database-aware health check and handles unknown routes", async () => {
        const health = await request(app).get("/api/health");
        assert.equal(health.status, 200);
        assert.equal(health.body.status, "ok");
        assert.equal(health.body.database, "connected");

        const missing = await request(app).get("/api/not-a-real-route");
        assert.equal(missing.status, 404);
        assert.equal(missing.body.message, "Route not found");

        const cors = await request(app)
            .get("/api/health")
            .set("Origin", "http://localhost:5173");

        assert.equal(cors.headers["access-control-allow-origin"], "http://localhost:5173");
        assert.equal(cors.headers["access-control-allow-credentials"], "true");
        assert.equal(cors.headers["x-content-type-options"], "nosniff");
    });

    test("handles malformed JSON with a JSON error response", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send('{"email":');

        assert.equal(response.status, 400);
        assert.equal(response.body.message, "Invalid JSON in request body");
    });

    test("requires 2-3 distinct security questions at registration", async () => {
        const base = makeUser();

        const missingAnswers = await request(app)
            .post("/api/auth/register")
            .send({ ...base, securityAnswers: undefined });

        assert.equal(missingAnswers.status, 400);
        assert.match(missingAnswers.body.message, /security questions/i);

        const singleAnswer = await request(app)
            .post("/api/auth/register")
            .send({
                ...makeUser(),
                securityAnswers: [
                    { questionId: "first_pet", answer: "Rex" }
                ]
            });

        assert.equal(singleAnswer.status, 400);
        assert.match(singleAnswer.body.message, /2-3 security questions/i);

        const duplicateQuestion = await request(app)
            .post("/api/auth/register")
            .send({
                ...makeUser(),
                securityAnswers: [
                    { questionId: "first_pet", answer: "Rex" },
                    { questionId: "first_pet", answer: "Buddy" }
                ]
            });

        assert.equal(duplicateQuestion.status, 400);
        assert.match(duplicateQuestion.body.message, /different security questions/i);

        const emptyAnswer = await request(app)
            .post("/api/auth/register")
            .send({
                ...makeUser(),
                securityAnswers: [
                    { questionId: "first_pet", answer: "   " },
                    { questionId: "birth_city", answer: "Mumbai" }
                ]
            });

        assert.equal(emptyAnswer.status, 400);
        assert.match(emptyAnswer.body.message, /answer all selected/i);

        assert.equal(await User.countDocuments(), 0);
    });

    test("recovers a password with normalized security answers and invalidates old sessions", async () => {
        const user = await createUser({
            securityAnswers: [
                { questionId: "childhood_nickname", answer: "Sunny" },
                { questionId: "first_pet", answer: "Milo" },
                { questionId: "birth_city", answer: "New Delhi" }
            ]
        });

        const catalog = await request(app).get("/api/auth/recovery/catalog");
        assert.equal(catalog.status, 200);
        assert.equal(catalog.body.questions.length >= 6, true);

        const questions = await request(app)
            .post("/api/auth/recovery/questions")
            .send({ email: `  ${user.data.email.toUpperCase()}  ` });

        assert.equal(questions.status, 200);
        assert.deepEqual(
            questions.body.questions.map((item) => item.questionId),
            ["childhood_nickname", "first_pet", "birth_city"]
        );

        const unknownQuestions = await request(app)
            .post("/api/auth/recovery/questions")
            .send({ email: "nobody@example.com" });

        assert.equal(unknownQuestions.status, 200);
        assert.equal(unknownQuestions.body.questions.length, 3);

        const wrongAnswers = await request(app)
            .post("/api/auth/recovery/reset")
            .send({
                email: user.data.email,
                newPassword: "new-secret-123",
                securityAnswers: [
                    { questionId: "childhood_nickname", answer: "Wrong" },
                    { questionId: "first_pet", answer: "Milo" },
                    { questionId: "birth_city", answer: "New Delhi" }
                ]
            });

        assert.equal(wrongAnswers.status, 401);
        assert.equal(
            wrongAnswers.body.message,
            "Unable to reset your password with the provided details"
        );

        const recoveryAgent = request.agent(app);
        const reset = await recoveryAgent
            .post("/api/auth/recovery/reset")
            .send({
                email: user.data.email,
                newPassword: "new-secret-123",
                securityAnswers: [
                    { questionId: "birth_city", answer: " new   delhi " },
                    { questionId: "first_pet", answer: "MILO" },
                    { questionId: "childhood_nickname", answer: "sunny" }
                ]
            });

        assert.equal(reset.status, 200, JSON.stringify(reset.body));
        assert.equal(reset.body.message, "Password reset successfully");
        assert.equal(reset.body.password, undefined);
        assert.equal(reset.body.securityAnswers, undefined);

        const me = await recoveryAgent.get("/api/auth/me");
        assert.equal(me.status, 200);
        assert.equal(me.body.user.username, user.data.username);
        assert.equal(me.body.user.securityAnswers, undefined);
        assert.equal(me.body.user.tokenVersion, undefined);

        // The token issued before the reset must no longer work.
        const oldSession = await user.agent.get("/api/auth/me");
        assert.equal(oldSession.status, 401);

        const oldPassword = await request(app)
            .post("/api/auth/login")
            .send({
                email: user.data.email,
                password: user.data.password
            });

        assert.equal(oldPassword.status, 401);

        const newPassword = await request(app)
            .post("/api/auth/login")
            .send({
                email: user.data.email,
                password: "new-secret-123"
            });

        assert.equal(newPassword.status, 200);

        const storedUser = await User.findOne({ email: user.data.email })
            .select("+securityAnswers");

        assert.equal(storedUser.securityAnswers.length, 3);
        for (const entry of storedUser.securityAnswers) {
            assert.ok(entry.answerHash);
            assert.notEqual(entry.answerHash, "Milo");
            assert.match(entry.answerHash, /^\$2[aby]\$/);
        }
    });

    test("returns generic failures for unknown accounts during recovery", async () => {
        const response = await request(app)
            .post("/api/auth/recovery/reset")
            .send({
                email: "missing@example.com",
                newPassword: "new-secret-123",
                securityAnswers: [
                    { questionId: "first_pet", answer: "Rex" },
                    { questionId: "birth_city", answer: "Mumbai" }
                ]
            });

        assert.equal(response.status, 401);
        assert.equal(
            response.body.message,
            "Unable to reset your password with the provided details"
        );
    });
});

describe("Message API", () => {
    test("creates a conversation, lists it, and returns enriched history", async () => {
        const sender = await createUser({ fullname: "Alice Sender" });
        const receiver = await createUser({ fullname: "Bob Receiver" });
        const outsider = await createUser();

        const send = await sender.agent
            .post(`/api/message/send/${receiver.id}`)
            .send({ message: "Hello Bob" });

        assert.equal(send.status, 201);
        assert.equal(send.body.success, true);
        assert.equal(send.body.data.message, "Hello Bob");
        assert.equal(send.body.data.reciverId, receiver.id);
        assert.ok(send.body.data.conversationId);

        const conversationId = send.body.data.conversationId;

        const reply = await receiver.agent
            .post(`/api/message/send/${sender.id}`)
            .send({ message: "Hi Alice" });

        assert.equal(reply.status, 201);
        assert.equal(reply.body.data.conversationId, conversationId);

        const conversations = await sender.agent.get("/api/message/conversations");

        assert.equal(conversations.status, 200);
        assert.equal(conversations.body.conversations.length, 1);
        assert.equal(conversations.body.pagination.total, 1);

        const conversation = conversations.body.conversations[0];
        assert.equal(conversation._id, conversationId);
        assert.equal(conversation.otherParticipant._id, receiver.id);
        assert.equal(conversation.otherParticipant.fullname, "Bob Receiver");
        assert.equal(conversation.lastMessage.message, "Hi Alice");
        assert.equal(conversation.lastMessage.senderId, receiver.id);
        assert.equal(conversation.participantKey, undefined);

        const history = await sender.agent.get(`/api/message/${conversationId}`);

        assert.equal(history.status, 200);
        assert.equal(history.body.messages.length, 2);
        assert.equal(history.body.pagination.hasMore, false);
        assert.equal(history.body.pagination.nextCursor, null);

        const [firstMessage, secondMessage] = history.body.messages;
        assert.equal(firstMessage.message, "Hello Bob");
        assert.equal(firstMessage.sender._id, sender.id);
        assert.equal(firstMessage.sender.fullname, "Alice Sender");
        assert.equal(firstMessage.receiver._id, receiver.id);
        assert.equal(firstMessage.receiver.fullname, "Bob Receiver");
        assert.equal(secondMessage.message, "Hi Alice");
        assert.equal(secondMessage.sender._id, receiver.id);

        const outsiderHistory = await outsider.agent.get(`/api/message/${conversationId}`);
        assert.equal(outsiderHistory.status, 403);
        assert.equal(
            outsiderHistory.body.message,
            "You are not a participant in this conversation"
        );

        const outsiderConversations = await outsider.agent.get("/api/message/conversations");
        assert.equal(outsiderConversations.status, 200);
        assert.equal(outsiderConversations.body.conversations.length, 0);
    });

    test("does not create duplicate conversations for the same pair", async () => {
        const sender = await createUser();
        const receiver = await createUser();

        const first = await sender.agent
            .post(`/api/message/send/${receiver.id}`)
            .send({ message: "First" });

        const second = await receiver.agent
            .post(`/api/message/send/${sender.id}`)
            .send({ message: "Second" });

        const third = await sender.agent
            .post(`/api/message/send/${receiver.id}`)
            .send({ message: "Third" });

        assert.equal(first.status, 201);
        assert.equal(second.status, 201);
        assert.equal(third.status, 201);

        const conversationId = first.body.data.conversationId;
        assert.equal(second.body.data.conversationId, conversationId);
        assert.equal(third.body.data.conversationId, conversationId);
        assert.equal(await Conversation.countDocuments(), 1);
        assert.equal(await Message.countDocuments(), 3);
    });

    test("rejects invalid, self, unknown, and oversized messages", async () => {
        const sender = await createUser();

        const invalidReceiver = await sender.agent
            .post("/api/message/send/not-an-id")
            .send({ message: "Hello" });

        assert.equal(invalidReceiver.status, 400);
        assert.equal(invalidReceiver.body.message, "Invalid receiver ID");

        const selfMessage = await sender.agent
            .post(`/api/message/send/${sender.id}`)
            .send({ message: "Hello me" });

        assert.equal(selfMessage.status, 400);
        assert.equal(selfMessage.body.message, "You cannot send a message to yourself");

        const unknownReceiver = await sender.agent
            .post(`/api/message/send/${new mongoose.Types.ObjectId().toString()}`)
            .send({ message: "Hello nobody" });

        assert.equal(unknownReceiver.status, 404);
        assert.equal(unknownReceiver.body.message, "Receiver not found");

        const emptyMessage = await sender.agent
            .post(`/api/message/send/${new mongoose.Types.ObjectId().toString()}`)
            .send({ message: "   " });

        assert.equal(emptyMessage.status, 400);
        assert.equal(emptyMessage.body.message, "Message is required");

        const receiver = await createUser();
        const longMessage = await sender.agent
            .post(`/api/message/send/${receiver.id}`)
            .send({ message: "a".repeat(2001) });

        assert.equal(longMessage.status, 400);
        assert.match(longMessage.body.message, /at most 2000 characters/i);
        assert.equal(await Conversation.countDocuments(), 0);
        assert.equal(await Message.countDocuments(), 0);
    });

    test("paginates message history with a cursor", async () => {
        const sender = await createUser();
        const receiver = await createUser();
        let conversationId;

        for (const message of ["one", "two", "three"]) {
            const response = await sender.agent
                .post(`/api/message/send/${receiver.id}`)
                .send({ message });

            assert.equal(response.status, 201);
            conversationId = response.body.data.conversationId;
        }

        const latest = await sender.agent
            .get(`/api/message/${conversationId}`)
            .query({ limit: 2 });

        assert.equal(latest.status, 200);
        assert.equal(latest.body.messages.length, 2);
        assert.deepEqual(
            latest.body.messages.map((message) => message.message),
            ["two", "three"]
        );
        assert.equal(latest.body.pagination.limit, 2);
        assert.equal(latest.body.pagination.hasMore, true);
        assert.ok(latest.body.pagination.nextCursor);

        const older = await sender.agent
            .get(`/api/message/${conversationId}`)
            .query({
                limit: 2,
                before: latest.body.pagination.nextCursor
            });

        assert.equal(older.status, 200);
        assert.deepEqual(
            older.body.messages.map((message) => message.message),
            ["one"]
        );
        assert.equal(older.body.pagination.hasMore, false);
        assert.equal(older.body.pagination.nextCursor, null);

        const invalidCursor = await sender.agent
            .get(`/api/message/${conversationId}`)
            .query({ before: "not-a-cursor" });

        assert.equal(invalidCursor.status, 400);
        assert.equal(invalidCursor.body.message, "Invalid message cursor");
    });

    test("paginates the conversation list", async () => {
        const sender = await createUser();
        const firstReceiver = await createUser();
        const secondReceiver = await createUser();

        await sender.agent
            .post(`/api/message/send/${firstReceiver.id}`)
            .send({ message: "First conversation" });

        await sender.agent
            .post(`/api/message/send/${secondReceiver.id}`)
            .send({ message: "Second conversation" });

        const firstPage = await sender.agent
            .get("/api/message/conversations")
            .query({ limit: 1, page: 1 });

        assert.equal(firstPage.status, 200);
        assert.equal(firstPage.body.conversations.length, 1);
        assert.equal(firstPage.body.pagination.total, 2);
        assert.equal(firstPage.body.pagination.hasMore, true);

        const secondPage = await sender.agent
            .get("/api/message/conversations")
            .query({ limit: 1, page: 2 });

        assert.equal(secondPage.status, 200);
        assert.equal(secondPage.body.conversations.length, 1);
        assert.equal(secondPage.body.pagination.hasMore, false);
    });

    test("requires authentication for all message endpoints", async () => {
        const conversationId = new mongoose.Types.ObjectId().toString();

        const list = await request(app).get("/api/message/conversations");
        assert.equal(list.status, 401);

        const send = await request(app)
            .post(`/api/message/send/${new mongoose.Types.ObjectId().toString()}`)
            .send({ message: "Hello" });
        assert.equal(send.status, 401);

        const history = await request(app).get(`/api/message/${conversationId}`);
        assert.equal(history.status, 401);
    });

    test("returns 404 for an unknown conversation and 400 for an invalid ID", async () => {
        const user = await createUser();
        const missingId = new mongoose.Types.ObjectId().toString();

        const missing = await user.agent.get(`/api/message/${missingId}`);
        assert.equal(missing.status, 404);
        assert.equal(missing.body.message, "Conversation not found");

        const invalid = await user.agent.get("/api/message/not-an-id");
        assert.equal(invalid.status, 400);
        assert.equal(invalid.body.message, "Invalid conversation ID");
    });
});
