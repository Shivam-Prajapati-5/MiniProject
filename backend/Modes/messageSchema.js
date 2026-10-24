import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reciverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        }
    },
    { timestamps: true }
);

messageSchema.index({ conversationId: 1, _id: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ reciverId: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
