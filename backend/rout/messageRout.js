import express from "express";
import {
    sendMessage,
    getMessages,
    getConversations
} from "../routControlers/messageroutControler.js";
import isLogin from "../middleware/isLogin.js";
import { messageSendLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.get("/conversations", isLogin, getConversations);

router.post("/send/:id", isLogin, messageSendLimiter, sendMessage);

router.get("/:conversationId", isLogin, getMessages);

export default router;
