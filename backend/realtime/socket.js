import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../Modes/useModels.js";
import Conversation from "../Modes/conversationModels.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookie.js";
import {
    conversationRoom,
    setIO,
    userRoom
} from "./io.js";

const parseCookies = (header = "") => {
    const cookies = {};

    for (const part of String(header).split(";")) {
        const separatorIndex = part.indexOf("=");

        if (separatorIndex < 0) {
            continue;
        }

        const name = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();

        if (!name) {
            continue;
        }

        try {
            cookies[name] = decodeURIComponent(value);
        } catch {
            cookies[name] = value;
        }
    }

    return cookies;
};

const getHandshakeTokens = (socket) => {
    const tokens = [];
    const authToken = socket.handshake.auth?.token;
    const cookieToken = parseCookies(socket.handshake.headers.cookie)[AUTH_COOKIE_NAME];

    if (typeof authToken === "string" && authToken) {
        tokens.push(authToken);
    }

    if (cookieToken) {
        tokens.push(cookieToken);
    }

    return tokens;
};

const verifyHandshakeToken = (socket) => {
    for (const token of getHandshakeTokens(socket)) {
        try {
            return jwt.verify(token, env.jwtSecret);
        } catch {
            // Try the next available credential.
        }
    }

    return null;
};

const onlineConnectionCounts = new Map();

const emitPresence = (io, userId, online) => {
    io.emit("presence:update", {
        userId: String(userId),
        online
    });
};

export const createSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || env.clientOrigins.includes(origin) || origin.endsWith(".vercel.app") || !env.isProduction) {
                    return callback(null, true);
                }
                return callback(new Error("Not allowed by CORS"));
            },
            credentials: true
        }
    });

    setIO(io);

    io.use(async (socket, next) => {
        try {
            const decoded = verifyHandshakeToken(socket);

            if (!decoded) {
                return next(new Error("Authentication required"));
            }

            const user = await User.findById(decoded.userId)
                .select("fullname username profilepicture +tokenVersion")
                .lean();

            if (!user) {
                return next(new Error("Authentication required"));
            }

            if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
                return next(new Error("Authentication required"));
            }

            socket.data.userId = String(user._id);
            socket.data.user = {
                _id: String(user._id),
                fullname: user.fullname,
                username: user.username,
                profilepicture: user.profilepicture
            };

            return next();
        } catch {
            return next(new Error("Authentication required"));
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.data.userId;

        await socket.join(userRoom(userId));

        try {
            const conversations = await Conversation.find({
                participants: userId
            })
                .select("_id")
                .lean();

            if (socket.connected && conversations.length > 0) {
                await socket.join(
                    conversations.map((conversation) => {
                        return conversationRoom(conversation._id);
                    })
                );
            }
        } catch (error) {
            console.error("Socket conversation join failed:", error.message);
        }

        const previousConnections = onlineConnectionCounts.get(userId) || 0;
        onlineConnectionCounts.set(userId, previousConnections + 1);

        if (previousConnections === 0) {
            emitPresence(io, userId, true);
        }

        socket.emit("presence:state", {
            userIds: [...onlineConnectionCounts.keys()]
        });

        socket.on("typing:start", (payload = {}) => {
            const conversationId = String(payload.conversationId || "");
            const room = conversationRoom(conversationId);

            if (!conversationId || !socket.rooms.has(room)) {
                return;
            }

            socket.to(room).emit("typing:update", {
                conversationId,
                userId,
                typing: true
            });
        });

        socket.on("typing:stop", (payload = {}) => {
            const conversationId = String(payload.conversationId || "");
            const room = conversationRoom(conversationId);

            if (!conversationId || !socket.rooms.has(room)) {
                return;
            }

            socket.to(room).emit("typing:update", {
                conversationId,
                userId,
                typing: false
            });
        });

        socket.on("disconnect", () => {
            const remainingConnections =
                (onlineConnectionCounts.get(userId) || 1) - 1;

            if (remainingConnections > 0) {
                onlineConnectionCounts.set(userId, remainingConnections);
                return;
            }

            onlineConnectionCounts.delete(userId);
            emitPresence(io, userId, false);
        });
    });

    return io;
};
