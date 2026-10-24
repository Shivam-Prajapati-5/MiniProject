import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],
            default: [],
            validate: {
                validator: (participants) => participants.length === 2,
                message: "A conversation must have exactly two participants"
            }
        },
        participantKey: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const ConverSation = mongoose.model("convesation", conversationSchema);

export default ConverSation;
