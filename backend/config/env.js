import "dotenv/config";

const parsePort = (value) => {
    const port = Number.parseInt(value, 10);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3000;
};

const parseOrigins = (value) => {
    return String(value || "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
};

export const env = Object.freeze({
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    port: parsePort(process.env.PORT),
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN)
});

export const assertRequiredEnv = () => {
    const missing = [];

    if (!env.mongoUri) {
        missing.push("MONGO_URI");
    }

    if (!env.jwtSecret) {
        missing.push("JWT_SECRET");
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
    }

    if (env.isProduction && env.jwtSecret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long in production");
    }
};
