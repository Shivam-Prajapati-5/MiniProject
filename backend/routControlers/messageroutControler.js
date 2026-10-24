import mongoose from "mongoose";
import Message from "../Modes/messageSchema.js";
import Conversation from "../Modes/conversationModels.js";
import User from "../Modes/useModels.js";
import {
    parsePagination,
    validateMessageInput
} from "../utils/validation.js";
import {
    conversationRoom,
    getIO,
    userRoom
} from "../realtime/io.js";

const USER_SUMMARY_FIELDS = "fullname username profilepicture";

const toIdString = (value) => {
    return String(value?._id ?? value);
};

const getParticipantKey = (firstId, secondId) => {
    return [toIdString(firstId), toIdString(secondId)].sort().join(":");
};

const isParticipant = (conversation, userId) => {
    return conversation.participants.some((participant) => {
        return toIdString(participant) === String(userId);
    });
};

const findOrCreateConversation = async (senderId, receiverId) => {
    const participantKey = getParticipantKey(senderId, receiverId);

    let conversation = await Conversation.findOne({ participantKey });

    if (conversation) {
        return conversation;
    }

    // Backward compatibility for conversations created before participantKey existed.
    conversation = await Conversation.findOne({
        participants: {
            $all: [senderId, receiverId],
            $size: 2
        }
    });

    if (conversation) {
        if (!conversation.participantKey) {
            conversation.participantKey = participantKey;

            try {
                await conversation.save();
            } catch (error) {
                if (error?.code !== 11000) {
                    throw error;
                }
            }
        }

        return conversation;
    }

    try {
        return await Conversation.create({
            participants: [senderId, receiverId],
            participantKey
        });
    } catch (error) {
        if (error?.code === 11000) {
            const existingConversation = await Conversation.findOne({ participantKey });

            if (existingConversation) {
                return existingConversation;
            }
        }

        throw error;
    }
};

const publishNewMessage = ({
    conversationId,
    senderId,
    receiverId,
    message
}) => {
    const io = getIO();

    if (!io) {
        return;
    }

    const room = conversationRoom(conversationId);

    try {
        // Make sure both users' live sockets receive subsequent typing events
        // and messages for a conversation that was just created.
        io.in(userRoom(senderId)).socketsJoin(room);
        io.in(userRoom(receiverId)).socketsJoin(room);

        io.to(room)
            .to(userRoom(senderId))
            .to(userRoom(receiverId))
            .emit("message:new", {
                conversationId: String(conversationId),
                message: message.toObject ? message.toObject() : message
            });
    } catch (error) {
        console.error("Realtime message emit failed:", error.message);
    }
};


// ================= SEND MESSAGE =================
export const sendMessage = async (req, res, next) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.id;

        const { value, error } = validateMessageInput(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        if (!mongoose.isValidObjectId(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID"
            });
        }

        if (toIdString(receiverId) === toIdString(senderId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself"
            });
        }

        const receiver = await User.findById(receiverId).select("_id");

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        const conversation = await findOrCreateConversation(senderId, receiverId);

        const newMessage = await Message.create({
            senderId,
            reciverId: receiverId,
            message: value.message,
            conversationId: conversation._id
        });

        await Conversation.updateOne(
            { _id: conversation._id },
            { $set: { updatedAt: new Date() } }
        );

        publishNewMessage({
            conversationId: conversation._id,
            senderId,
            receiverId,
            message: newMessage
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage
        });

    } catch (error) {
        return next(error);
    }
};


// ================= GET CONVERSATIONS =================
export const getConversations = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 20, 100);
        const filter = { participants: req.user._id };

        const [conversations, total] = await Promise.all([
            Conversation.find(filter)
                .populate("participants", USER_SUMMARY_FIELDS)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Conversation.countDocuments(filter)
        ]);

        const conversationIds = conversations.map((conversation) => conversation._id);
        let lastMessageByConversation = new Map();

        if (conversationIds.length > 0) {
            const lastMessages = await Message.aggregate([
                {
                    $match: {
                        conversationId: { $in: conversationIds }
                    }
                },
                {
                    $sort: {
                        createdAt: -1,
                        _id: -1
                    }
                },
                {
                    $group: {
                        _id: "$conversationId",
                        lastMessage: { $first: "$$ROOT" }
                    }
                }
            ]);

            lastMessageByConversation = new Map(
                lastMessages.map((item) => [
                    String(item._id),
                    item.lastMessage
                ])
            );
        }

        const result = conversations.map((conversation) => {
            const otherParticipant = conversation.participants.find((participant) => {
                return toIdString(participant) !== String(req.user._id);
            }) || null;

            return {
                _id: conversation._id,
                participants: conversation.participants,
                otherParticipant,
                lastMessage: lastMessageByConversation.get(String(conversation._id)) || null,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            };
        });

        return res.status(200).json({
            success: true,
            conversations: result,
            pagination: {
                page,
                limit,
                total,
                hasMore: page * limit < total
            }
        });

    } catch (error) {
        return next(error);
    }
};


// ================= GET MESSAGES =================
export const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { before } = req.query;

        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        if (before && !mongoose.isValidObjectId(before)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message cursor"
            });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        if (!isParticipant(conversation, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this conversation"
            });
        }

        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 100)
            : 50;

        const query = { conversationId };

        if (before) {
            query._id = { $lt: before };
        }

        const foundMessages = await Message.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean();

        const hasMore = foundMessages.length > limit;
        const page = foundMessages.slice(0, limit).reverse();

        const userIds = [
            ...new Set(
                page.flatMap((message) => [
                    toIdString(message.senderId),
                    toIdString(message.reciverId)
                ])
            )
        ];

        const users = userIds.length > 0
            ? await User.find({ _id: { $in: userIds } })
                .select(USER_SUMMARY_FIELDS)
                .lean()
            : [];

        const userMap = new Map(
            users.map((user) => [String(user._id), user])
        );

        const messages = page.map((message) => ({
            ...message,
            sender: userMap.get(toIdString(message.senderId)) || null,
            receiver: userMap.get(toIdString(message.reciverId)) || null
        }));

        return res.status(200).json({
            success: true,
            messages,
            pagination: {
                limit,
                hasMore,
                nextCursor: hasMore && page.length > 0
                    ? toIdString(page[0]._id)
                    : null
            }
        });

    } catch (error) {
        return next(error);
    }
};
