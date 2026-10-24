import http from "node:http";
import mongoose from "mongoose";
import { assertRequiredEnv, env } from "./config/env.js";
import dbConnect from "./DB/dbConnect.js";
import app from "./app.js";
import { createSocketServer } from "./realtime/socket.js";

const startServer = async () => {
    try {
        assertRequiredEnv();
        await dbConnect();

        const server = http.createServer(app);
        const io = createSocketServer(server);

        server.listen(env.port, () => {
            console.log(`Working at ${env.port}`);
        });

        server.on("error", (error) => {
            console.error("Server listen error:", error.message);
            process.exit(1);
        });

        let shuttingDown = false;

        const shutdown = (signal) => {
            if (shuttingDown) {
                return;
            }

            shuttingDown = true;
            console.log(`${signal} received. Shutting down...`);

            const forceExitTimer = setTimeout(() => {
                console.error("Forced shutdown after timeout");
                process.exit(1);
            }, 10000);

            forceExitTimer.unref();

            // Closing Socket.IO also closes the attached HTTP server.
            io.close(async () => {
                try {
                    await mongoose.disconnect();
                    console.log("Shutdown complete");
                    process.exit(0);
                } catch (error) {
                    console.error("Shutdown error:", error.message);
                    process.exit(1);
                }
            });
        };

        process.once("SIGINT", () => shutdown("SIGINT"));
        process.once("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        console.error("Server start nahi hua:", error.message);
        process.exit(1);
    }
};

startServer();
