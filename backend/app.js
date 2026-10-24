import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import authRouter from "./rout/authuser.js";
import messageRouter from "./rout/messageRout.js";
import {
    errorHandler,
    notFoundHandler
} from "./middleware/errorHandler.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDistDirectory = path.resolve(currentDirectory, "../frontend/dist");
const frontendIndexPath = path.join(frontendDistDirectory, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

const app = express();

if (env.isProduction) {
    app.set("trust proxy", 1);
}

app.disable("x-powered-by");

const contentSecurityPolicy = {
    directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "ws:", "wss:"]
    }
};

if (!env.isProduction) {
    delete contentSecurityPolicy.directives["upgrade-insecure-requests"];
}

app.use(helmet({ contentSecurityPolicy }));

app.use(cors({
    origin: env.clientOrigins,
    credentials: true
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/message", messageRouter);

app.get("/", (req, res) => {
    if (hasFrontendBuild) {
        return res.sendFile(frontendIndexPath);
    }

    return res.type("text/plain").send("Backend is working!");
});

app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    return res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        status: databaseConnected ? "ok" : "degraded",
        database: databaseConnected ? "connected" : "disconnected"
    });
});

if (hasFrontendBuild) {
    app.use(express.static(frontendDistDirectory, { index: false }));

    // BrowserRouter fallback for client-side routes. API and Socket.IO paths
    // still receive their normal JSON/404 responses.
    app.use((req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
            return next();
        }

        return res.sendFile(frontendIndexPath);
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
