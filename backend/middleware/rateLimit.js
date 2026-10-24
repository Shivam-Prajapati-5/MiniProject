import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

const skipRateLimit = () => env.nodeEnv === "test";

// Vercel adds the browser IP to X-Forwarded-For before proxying to Render.
// Using the first entry keeps users in separate buckets when the API is
// reached through the Vercel proxy.
const clientKey = (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];

    if (typeof forwardedFor === "string") {
        const first = forwardedFor.split(",")[0].trim();

        if (first) {
            return first;
        }
    }

    return req.ip;
};

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
    keyGenerator: clientKey,
    validate: { keyGeneratorIpFallback: false },
    handler: rateLimitHandler
});

export const recoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 12,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipRateLimit,
    keyGenerator: clientKey,
    validate: { keyGeneratorIpFallback: false },
    handler: rateLimitHandler
});

export const messageSendLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipRateLimit,
    keyGenerator: clientKey,
    validate: { keyGeneratorIpFallback: false },
    handler: rateLimitHandler
});
