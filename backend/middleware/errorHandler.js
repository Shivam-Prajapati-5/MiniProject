import { env } from "../config/env.js";

export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found"
    });
};

export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error?.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body"
        });
    }

    if (error?.name === "ValidationError") {
        const messages = Object.values(error.errors || {})
            .map((validationError) => validationError.message);

        return res.status(400).json({
            success: false,
            message: messages[0] || "Validation failed",
            errors: messages
        });
    }

    if (error?.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID"
        });
    }

    if (error?.code === 11000) {
        const field = Object.keys(error.keyValue || error.keyPattern || {})[0];
        const labels = {
            email: "Email",
            username: "Username",
            participantKey: "Conversation"
        };
        const label = labels[field] || "Value";

        return res.status(409).json({
            success: false,
            message: `${label} already exists`
        });
    }

    if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 600) {
        return res.status(error.status).json({
            success: false,
            message: error.message || "Request failed"
        });
    }

    console.error("Unhandled error:", error);

    return res.status(500).json({
        success: false,
        message: env.isProduction
            ? "Internal server error"
            : error.message || "Internal server error"
    });
};
