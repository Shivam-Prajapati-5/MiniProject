import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

const skipRateLimit = () => env.nodeEnv === "test";

const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
    });
};

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipRateLimit,
    handler: rateLimitHandler
});

export const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipRateLimit,
    handler: rateLimitHandler
});

export const messageSendLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipRateLimit,
    handler: rateLimitHandler
});
