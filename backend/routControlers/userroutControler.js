import User from "../Modes/useModels.js";
import bcryptjs from "bcryptjs";
import jwtToken, {
    createSocketToken,
    SOCKET_TOKEN_TTL_SECONDS
} from "../utils/jwtwebToken.js";
import {
    AUTH_COOKIE_NAME,
    clearAuthCookieOptions
} from "../utils/authCookie.js";
import {
    asTrimmedString,
    escapeRegExp,
    parsePagination,
    validateLoginInput,
    validatePasswordResetInput,
    validateRecoveryEmailInput,
    validateRegisterInput
} from "../utils/validation.js";
import {
    DEFAULT_RECOVERY_QUESTION_IDS,
    SECURITY_QUESTIONS,
    getSecurityQuestion
} from "../utils/securityQuestions.js";
import { getIO, userRoom } from "../realtime/io.js";

const RECOVERY_FAILURE_MESSAGE =
    "Unable to reset your password with the provided details";

// A real bcrypt hash keeps response timing similar for unknown accounts.
const DECOY_ANSWER_HASH = bcryptjs.hashSync("nexchat-recovery-decoy", 10);

const authResponse = (user, message) => ({
    success: true,
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    profilepicture: user.profilepicture,
    email: user.email,
    message
});

const publicQuestion = (questionId) => {
    const question = getSecurityQuestion(questionId);

    return question
        ? {
            questionId: question.id,
            question: question.question
        }
        : null;
};

// ================= REGISTER USER =================
export const userRegister = async (req, res, next) => {
    try {
        const { value, error } = validateRegisterInput(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const {
            fullname,
            username,
            email,
            gender,
            password,
            profilepicture,
            securityAnswers
        } = value;

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingUser) {
            const usernameExists = existingUser.username === username;
            const emailExists = existingUser.email === email;

            return res.status(400).json({
                success: false,
                message: usernameExists && emailExists
                    ? "Username and Email Already Exist"
                    : usernameExists
                        ? "Username Already Exists"
                        : "Email Already Exists"
            });
        }

        const [hashPassword, hashedAnswers] = await Promise.all([
            bcryptjs.hash(password, 10),
            Promise.all(
                securityAnswers.map(async ({ questionId, answer }) => ({
                    questionId,
                    answerHash: await bcryptjs.hash(answer, 10)
                }))
            )
        ]);

        const avatarType = gender === "male" ? "boy" : "girl";
        const generatedPicture =
            `https://avatar.iran.liara.run/public/${avatarType}?username=${encodeURIComponent(username)}`;

        const newUser = await User.create({
            fullname,
            username,
            email,
            gender,
            password: hashPassword,
            profilepicture: profilepicture || generatedPicture,
            securityAnswers: hashedAnswers
        });

        jwtToken(newUser._id, res, newUser.tokenVersion ?? 0);

        return res.status(201).json(
            authResponse(newUser, "User registered successfully")
        );

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Username or Email Already Exists"
            });
        }

        return next(error);
    }
};


// ================= LOGIN USER =================
export const userLogin = async (req, res, next) => {
    try {
        const { value, error } = validateLoginInput(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const { email, password } = value;

        const user = await User.findOne({ email })
            .select("+password +tokenVersion");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const comparePass = await bcryptjs.compare(
            password,
            user.password || ""
        );

        if (!comparePass) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        jwtToken(user._id, res, user.tokenVersion ?? 0);

        return res.status(200).json(
            authResponse(user, "Successfully logged in")
        );

    } catch (error) {
        return next(error);
    }
};


// ================= LOGOUT USER =================
export const userLogout = async (req, res, next) => {
    try {
        res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        return next(error);
    }
};


// ================= GET CURRENT USER =================
export const getCurrentUser = async (req, res) => {
    const user = req.user;

    return res.status(200).json({
        success: true,
        user: {
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            gender: user.gender,
            profilepicture: user.profilepicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    });
};


// ================= SOCKET HANDSHAKE TOKEN =================
// Used when the frontend and API are on different origins (Render + Vercel).
// The HTTP session stays in the HttpOnly cookie; this short-lived token is
// sent in the Socket.IO handshake auth payload instead of a cross-site cookie.
export const getSocketToken = (req, res) => {
    res.set("Cache-Control", "no-store");

    return res.status(200).json({
        success: true,
        token: createSocketToken(req.user._id, req.user.tokenVersion ?? 0),
        expiresIn: SOCKET_TOKEN_TTL_SECONDS
    });
};


// ================= GET ALL USERS =================
export const getUsers = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query, 20, 100);
        const search = asTrimmedString(req.query.search).slice(0, 50);

        const filter = {
            _id: { $ne: req.user._id }
        };

        if (search) {
            const pattern = new RegExp(escapeRegExp(search), "i");
            filter.$or = [
                { fullname: pattern },
                { username: pattern }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("fullname username profilepicture createdAt")
                .sort({ fullname: 1, username: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            users,
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


// ================= RECOVERY QUESTION CATALOG =================
export const getRecoveryQuestionCatalog = (req, res) => {
    res.set("Cache-Control", "public, max-age=3600");

    return res.status(200).json({
        success: true,
        questions: SECURITY_QUESTIONS.map(({ id, question }) => ({
            questionId: id,
            question
        }))
    });
};


// ================= GET RECOVERY QUESTIONS =================
export const getRecoveryQuestions = async (req, res, next) => {
    try {
        const { value, error } = validateRecoveryEmailInput(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const user = await User.findOne({ email: value.email })
            .select("+securityAnswers")
            .lean();

        const configuredQuestionIds = (user?.securityAnswers || [])
            .map((entry) => entry.questionId)
            .filter(Boolean);

        const questionIds = configuredQuestionIds.length > 0
            ? configuredQuestionIds
            : DEFAULT_RECOVERY_QUESTION_IDS;

        const questions = questionIds.map(publicQuestion).filter(Boolean);

        res.set("Cache-Control", "no-store");

        // The same shape is returned whether or not the email is registered,
        // which avoids leaking account existence.
        return res.status(200).json({
            success: true,
            questions
        });

    } catch (error) {
        return next(error);
    }
};


// ================= RESET PASSWORD WITH SECURITY ANSWERS =================
export const resetPasswordWithSecurityAnswers = async (req, res, next) => {
    try {
        const { value, error } = validatePasswordResetInput(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const user = await User.findOne({ email: value.email })
            .select("+password +securityAnswers +tokenVersion");

        const storedAnswers = user?.securityAnswers || [];

        if (!user || storedAnswers.length === 0) {
            await Promise.all(
                value.securityAnswers.map(({ answer }) => {
                    return bcryptjs.compare(answer, DECOY_ANSWER_HASH);
                })
            );

            return res.status(401).json({
                success: false,
                message: RECOVERY_FAILURE_MESSAGE
            });
        }

        const providedByQuestion = new Map(
            value.securityAnswers.map(({ questionId, answer }) => [
                questionId,
                answer
            ])
        );

        const comparisons = await Promise.all(
            storedAnswers.map(({ questionId, answerHash }) => {
                const providedAnswer = providedByQuestion.get(questionId);

                if (providedAnswer === undefined) {
                    return false;
                }

                return bcryptjs.compare(providedAnswer, answerHash);
            })
        );

        const answersMatch =
            storedAnswers.length === value.securityAnswers.length &&
            comparisons.every(Boolean);

        if (!answersMatch) {
            return res.status(401).json({
                success: false,
                message: RECOVERY_FAILURE_MESSAGE
            });
        }

        const hashPassword = await bcryptjs.hash(value.newPassword, 10);
        const nextTokenVersion = (user.tokenVersion ?? 0) + 1;

        await User.updateOne(
            { _id: user._id },
            {
                $set: { password: hashPassword },
                $inc: { tokenVersion: 1 }
            }
        );

        // Close live sockets so a stolen/older session cannot keep receiving
        // messages. Clients reconnect with the new cookie and token version.
        const io = getIO();

        if (io) {
            try {
                io.in(userRoom(user._id)).disconnectSockets(true);
            } catch (error) {
                console.error("Socket session invalidation failed:", error.message);
            }
        }

        // Invalidate every existing session for this account.
        jwtToken(user._id, res, nextTokenVersion);

        return res.status(200).json(
            authResponse(user, "Password reset successfully")
        );

    } catch (error) {
        return next(error);
    }
};
