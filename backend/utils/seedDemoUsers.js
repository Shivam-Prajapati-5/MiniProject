import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { env, assertRequiredEnv } from "../config/env.js";
import User from "../Modes/useModels.js";
import Conversation from "../Modes/conversationModels.js";
import Message from "../Modes/messageSchema.js";
import FriendRequest from "../Modes/friendRequestModel.js";
import { normalizeSecurityAnswer } from "./securityQuestions.js";

const DEMO_PASSWORD = "password123";

const demoUsers = [
    {
        fullname: "Alex Rivera",
        username: "alex_r",
        email: "alex@example.com",
        gender: "male",
        profilepicture: "🦊",
        securityAnswers: [
            { questionId: "first_pet", answer: "Buddy" },
            { questionId: "birth_city", answer: "Seattle" },
            { questionId: "first_school", answer: "Lincoln High" }
        ]
    },
    {
        fullname: "Sarah Chen",
        username: "sarah_c",
        email: "sarah@example.com",
        gender: "female",
        profilepicture: "✨",
        securityAnswers: [
            { questionId: "first_pet", answer: "Milo" },
            { questionId: "birth_city", answer: "San Francisco" },
            { questionId: "first_school", answer: "Bayview" }
        ]
    },
    {
        fullname: "Devon Price",
        username: "devon_p",
        email: "devon@example.com",
        gender: "male",
        profilepicture: "⚡",
        securityAnswers: [
            { questionId: "first_pet", answer: "Rocky" },
            { questionId: "birth_city", answer: "Denver" },
            { questionId: "first_school", answer: "Summit" }
        ]
    },
    {
        fullname: "Elena Rostova",
        username: "elena_r",
        email: "elena@example.com",
        gender: "female",
        profilepicture: "🚀",
        securityAnswers: [
            { questionId: "first_pet", answer: "Luna" },
            { questionId: "birth_city", answer: "Austin" },
            { questionId: "first_school", answer: "Westlake" }
        ]
    }
];

const seed = async () => {
    try {
        assertRequiredEnv();
        console.log("Connecting to MongoDB...");
        await mongoose.connect(env.mongoUri, { family: 4 });
        console.log("Connected to MongoDB Atlas.");

        console.log("Clearing existing database collections (users, messages, conversations, friend requests)...");
        await Message.deleteMany({});
        await Conversation.deleteMany({});
        await FriendRequest.deleteMany({});
        await User.deleteMany({});
        console.log("Database cleared successfully.");

        const hashedPassword = await bcryptjs.hash(DEMO_PASSWORD, 10);
        const createdUsers = [];

        for (const data of demoUsers) {
            const securityAnswers = await Promise.all(
                data.securityAnswers.map(async (a) => ({
                    questionId: a.questionId,
                    answerHash: await bcryptjs.hash(normalizeSecurityAnswer(a.answer), 10)
                }))
            );

            const user = await User.create({
                fullname: data.fullname,
                username: data.username,
                email: data.email,
                gender: data.gender,
                password: hashedPassword,
                profilepicture: data.profilepicture,
                securityAnswers
            });
            console.log(`Created demo user: ${user.fullname} (@${user.username}) [${user.profilepicture}]`);
            createdUsers.push(user);
        }

        const [alex, sarah, devon, elena] = createdUsers;

        // 1. Alex and Sarah are accepted friends with active conversation
        await FriendRequest.create({
            sender: alex._id,
            receiver: sarah._id,
            status: "accepted"
        });

        const participantKey = [String(alex._id), String(sarah._id)].sort().join(":");
        const conversation = await Conversation.create({
            participants: [alex._id, sarah._id],
            participantKey
        });

        await Message.create({
            senderId: alex._id,
            reciverId: sarah._id,
            conversationId: conversation._id,
            message: "Sarah, live telemetry is looking rock solid across all channels."
        });

        await Message.create({
            senderId: sarah._id,
            reciverId: alex._id,
            conversationId: conversation._id,
            message: "Agreed! Real-time message transit is instantaneous. The emoji avatars feel exceptionally clean."
        });

        // 2. Devon sent a pending friend request to Alex
        await FriendRequest.create({
            sender: devon._id,
            receiver: alex._id,
            status: "pending"
        });
        console.log("Created pending friend request from Devon to Alex.");

        // 3. Elena is an un-added user in the database so Alex can test "Add Contact" search!
        console.log("Elena Rostova available for contact search.");

        console.log("\n🎉 Database cleared & fresh demo users seeded!");
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seed();
