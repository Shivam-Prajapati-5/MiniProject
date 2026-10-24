import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "../config/env.js";

// Force IPv4 first in DNS resolution to prevent Node 20+ IPv6 SRV lookup timeouts on Linux containers
dns.setDefaultResultOrder("ipv4first");

const sanitizeUri = (uri) => {
    return uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
};

const dbConnect = async () => {
    try {
        console.log(`Connecting to database at ${sanitizeUri(env.mongoUri)}...`);

        await mongoose.connect(env.mongoUri, {
            family: 4,
            serverSelectionTimeoutMS: 15000
        });

        console.log("DB connected successfully");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        throw error;
    }
};

export default dbConnect;
