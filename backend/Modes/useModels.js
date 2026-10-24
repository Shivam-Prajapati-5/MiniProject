import mongoose from "mongoose";
import {
    MAX_SECURITY_ANSWERS,
    MIN_SECURITY_ANSWERS,
    SECURITY_QUESTION_IDS
} from "../utils/securityQuestions.js";

const userSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: /^[a-zA-Z0-9._-]+$/
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        gender: {
            type: String,
            required: true,
            enum: ["male", "female"]
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        profilepicture: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        securityAnswers: {
            type: [
                {
                    _id: false,
                    questionId: {
                        type: String,
                        required: true,
                        enum: SECURITY_QUESTION_IDS
                    },
                    answerHash: {
                        type: String,
                        required: true
                    }
                }
            ],
            select: false,
            default: undefined,
            validate: {
                validator: (answers) => {
                    return !answers || (
                        answers.length >= MIN_SECURITY_ANSWERS &&
                        answers.length <= MAX_SECURITY_ANSWERS
                    );
                },
                message: `Choose between ${MIN_SECURITY_ANSWERS} and ${MAX_SECURITY_ANSWERS} security questions`
            }
        },
        tokenVersion: {
            type: Number,
            default: 0,
            select: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
