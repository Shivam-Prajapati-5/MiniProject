import mongoose from "mongoose";
import { env } from "../config/env.js";

const dbConnect = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        console.log("DB connected successfully");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        throw error;
    }
};

export default dbConnect;
