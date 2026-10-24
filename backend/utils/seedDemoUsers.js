import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { env, assertRequiredEnv } from "../config/env.js";
import User from "../Modes/useModels.js";
import Conversation from "../Modes/conversationModels.js";
import Message from "../Modes/messageSchema.js";
import { normalizeSecurityAnswer } from "./securityQuestions.js";

const DEMO_PASSWORD = "password123";

const demoUsers = [
    {
        fullname: "Alex Morgan",
        username: "alex_m",
        email: "alex@example.com",
        gender: "male",
        profilepicture: "https://avatar.iran.liara.run/public/boy?username=alex_m",
        securityAnswers: [
            { questionId: "first_pet", answer: "Buddy" },
            { questionId: "birth_city", answer: "Seattle" },
            { questionId: "first_school", answer: "Lincoln High" }
        ]
    },
    {
        fullname: "Sophia Chen",
        username: "sophia_c",
        email: "sophia@example.com",
        gender: "female",
        profilepicture: "https://avatar.iran.liara.run/public/girl?username=sophia_c",
        securityAnswers: [
            { questionId: "first_pet", answer: "Milo" },
            { questionId: "birth_city", answer: "San Francisco" },
            { questionId: "first_school", answer: "Bayview" }
        ]
    },
    {
        fullname: "Liam Novak",
        username: "liam_n",
        email: "liam@example.com",
        gender: "male",
        profilepicture: "https://avatar.iran.liara.run/public/boy?username=liam_n",
        securityAnswers: [
            { questionId: "first_pet", answer: "Rocky" },
            { questionId: "birth_city", answer: "Denver" },
            { questionId: "first_school", answer: "Summit" }
        ]
    }
];

const seed = async () => {
    try {
        assertRequiredEnv();
        console.log("Connecting to MongoDB...");
        await mongoose.connect(env.mongoUri, { family: 4 });
        console.log("Connected to MongoDB Atlas.");

        const hashedPassword = await bcryptjs.hash(DEMO_PASSWORD, 10);
        const createdUsers = [];

        for (const data of demoUsers) {
            let user = await User.findOne({
                $or: [{ email: data.email }, { username: data.username }]
            });

            if (!user) {
                const securityAnswers = await Promise.all(
                    data.securityAnswers.map(async (a) => ({
                        questionId: a.questionId,
                        answerHash: await bcryptjs.hash(normalizeSecurityAnswer(a.answer), 10)
                    }))
                );

                user = await User.create({
                    fullname: data.fullname,
                    username: data.username,
                    email: data.email,
                    gender: data.gender,
                    password: hashedPassword,
                    profilepicture: data.profilepicture,
                    securityAnswers
                });
                console.log(`Created demo user: ${user.fullname} (@${user.username})`);
            } else {
                console.log(`Demo user already exists: ${user.fullname} (@${user.username})`);
            }

            createdUsers.push(user);
        }

        // Seed a sample conversation between Alex and Sophia
        if (createdUsers.length >= 2) {
            const [alex, sophia] = createdUsers;
            const participantKey = [String(alex._id), String(sophia._id)].sort().join(":");

            let conversation = await Conversation.findOne({ participantKey });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [alex._id, sophia._id],
                    participantKey
                });

                await Message.create({
                    senderId: alex._id,
                    reciverId: sophia._id,
                    conversationId: conversation._id,
                    message: "Hey Sophia, welcome to NexChat! 🚀"
                });

                await Message.create({
                    senderId: sophia._id,
                    reciverId: alex._id,
                    conversationId: conversation._id,
                    message: "Hey Alex! The interface looks gorgeous and messages are instant!"
                });

                console.log("Created demo conversation between Alex and Sophia.");
            }
        }

        console.log("\n🎉 Database seeding completed successfully!");
        console.log("Demo credentials to log in with:");
        for (const u of demoUsers) {
            console.log(`  • Email: ${u.email} | Password: ${DEMO_PASSWORD} (@${u.username})`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seed();
