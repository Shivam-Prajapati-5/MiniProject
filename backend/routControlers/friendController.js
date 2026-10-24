import mongoose from "mongoose";
import FriendRequest from "../Modes/friendRequestModel.js";
import User from "../Modes/useModels.js";
import Conversation from "../Modes/conversationModels.js";
import { getIO, userRoom } from "../realtime/io.js";
import { asTrimmedString, escapeRegExp } from "../utils/validation.js";

const USER_SUMMARY = "fullname username profilepicture createdAt";

const toId = (val) => String(val?._id || val);

// ================= SEARCH USERS TO ADD =================
export const searchUsers = async (req, res, next) => {
    try {
        const query = asTrimmedString(req.query.q || req.query.search).slice(0, 50);

        if (!query) {
            return res.status(200).json({ success: true, users: [] });
        }

        const pattern = new RegExp(escapeRegExp(query), "i");
        const currentUserId = req.user._id;

        // Find users matching search, excluding current user
        const matchedUsers = await User.find({
            _id: { $ne: currentUserId },
            $or: [{ username: pattern }, { fullname: pattern }]
        })
            .select(USER_SUMMARY)
            .limit(20)
            .lean();

        if (matchedUsers.length === 0) {
            return res.status(200).json({ success: true, users: [] });
        }

        const userIds = matchedUsers.map((u) => u._id);

        // Fetch existing requests between current user and found users
        const existingRequests = await FriendRequest.find({
            $or: [
                { sender: currentUserId, receiver: { $in: userIds } },
                { receiver: currentUserId, sender: { $in: userIds } }
            ]
        }).lean();

        const requestMap = new Map();
        for (const reqItem of existingRequests) {
            const otherId = toId(reqItem.sender) === String(currentUserId)
                ? toId(reqItem.receiver)
                : toId(reqItem.sender);

            const isSender = toId(reqItem.sender) === String(currentUserId);
            requestMap.set(otherId, {
                status: reqItem.status,
                isSender,
                requestId: reqItem._id
            });
        }

        const results = matchedUsers.map((user) => {
            const relation = requestMap.get(String(user._id));
            let friendStatus = "none";

            if (relation) {
                if (relation.status === "accepted") {
                    friendStatus = "friends";
                } else if (relation.status === "pending") {
                    friendStatus = relation.isSender ? "pending_sent" : "pending_received";
                }
            }

            return {
                ...user,
                friendStatus,
                requestId: relation?.requestId || null
            };
        });

        return res.status(200).json({
            success: true,
            users: results
        });
    } catch (error) {
        return next(error);
    }
};

// ================= SEND FRIEND REQUEST =================
export const sendFriendRequest = async (req, res, next) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.user._id;

        if (!mongoose.isValidObjectId(targetUserId)) {
            return res.status(400).json({ success: false, message: "Invalid target user ID" });
        }

        if (String(targetUserId) === String(currentUserId)) {
            return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });
        }

        const targetUser = await User.findById(targetUserId).select(USER_SUMMARY).lean();
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if a request already exists in either direction
        let existing = await FriendRequest.findOne({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId }
            ]
        });

        if (existing) {
            if (existing.status === "accepted") {
                return res.status(400).json({ success: false, message: "You are already contacts with this user" });
            }
            if (existing.status === "pending") {
                return res.status(400).json({ success: false, message: "A friend request is already pending between you" });
            }
            // If declined previously, reset to pending
            existing.sender = currentUserId;
            existing.receiver = targetUserId;
            existing.status = "pending";
            await existing.save();
        } else {
            existing = await FriendRequest.create({
                sender: currentUserId,
                receiver: targetUserId,
                status: "pending"
            });
        }

        // Notify receiver in real-time
        const io = getIO();
        if (io) {
            const senderPayload = {
                _id: existing._id,
                sender: {
                    _id: req.user._id,
                    fullname: req.user.fullname,
                    username: req.user.username,
                    profilepicture: req.user.profilepicture
                },
                createdAt: existing.createdAt
            };
            io.to(userRoom(targetUserId)).emit("friend:request_received", senderPayload);
        }

        return res.status(201).json({
            success: true,
            message: `Friend request sent to @${targetUser.username}`,
            request: existing
        });
    } catch (error) {
        return next(error);
    }
};

// ================= GET INCOMING PENDING REQUESTS =================
export const getFriendRequests = async (req, res, next) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: "pending"
        })
            .populate("sender", USER_SUMMARY)
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        return next(error);
    }
};

// ================= ACCEPT FRIEND REQUEST =================
export const acceptFriendRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.isValidObjectId(requestId)) {
            return res.status(400).json({ success: false, message: "Invalid request ID" });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: "pending"
        }).populate("sender", USER_SUMMARY);

        if (!request) {
            return res.status(404).json({ success: false, message: "Pending request not found" });
        }

        request.status = "accepted";
        await request.save();

        // Ensure a conversation document exists for this pair
        const senderId = request.sender._id;
        const receiverId = req.user._id;
        const participantKey = [String(senderId), String(receiverId)].sort().join(":");

        let conversation = await Conversation.findOne({ participantKey });
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                participantKey
            });
        }

        // Notify the original sender in real-time
        const io = getIO();
        if (io) {
            io.to(userRoom(senderId)).emit("friend:request_accepted", {
                friend: {
                    _id: req.user._id,
                    fullname: req.user.fullname,
                    username: req.user.username,
                    profilepicture: req.user.profilepicture
                },
                conversationId: conversation._id
            });
        }

        return res.status(200).json({
            success: true,
            message: `You are now connected with @${request.sender.username}`,
            friend: request.sender,
            conversationId: conversation._id
        });
    } catch (error) {
        return next(error);
    }
};

// ================= DECLINE FRIEND REQUEST =================
export const declineFriendRequest = async (req, res, next) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.isValidObjectId(requestId)) {
            return res.status(400).json({ success: false, message: "Invalid request ID" });
        }

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({ success: false, message: "Pending request not found" });
        }

        request.status = "declined";
        await request.save();

        return res.status(200).json({
            success: true,
            message: "Friend request declined"
        });
    } catch (error) {
        return next(error);
    }
};

// ================= GET ACCEPTED CONTACTS / FRIENDS =================
export const getFriends = async (req, res, next) => {
    try {
        const currentUserId = req.user._id;

        const acceptedRecords = await FriendRequest.find({
            status: "accepted",
            $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        })
            .populate("sender", USER_SUMMARY)
            .populate("receiver", USER_SUMMARY)
            .sort({ updatedAt: -1 })
            .lean();

        // Map to the friend object (the other person)
        const friends = acceptedRecords.map((item) => {
            const isSender = toId(item.sender) === String(currentUserId);
            return isSender ? item.receiver : item.sender;
        });

        return res.status(200).json({
            success: true,
            friends
        });
    } catch (error) {
        return next(error);
    }
};
