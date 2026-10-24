import {
    MAX_SECURITY_ANSWER_LENGTH,
    MAX_SECURITY_ANSWERS,
    MIN_SECURITY_ANSWERS,
    isValidSecurityQuestionId,
    normalizeSecurityAnswer
} from "./securityQuestions.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_PROFILE_PICTURE_LENGTH = 500;

export const asTrimmedString = (value) => {
    return typeof value === "string" ? value.trim() : "";
};

export const asEmail = (value) => {
    return asTrimmedString(value).toLowerCase();
};

export const isValidEmail = (value) => {
    return value.length <= 254 && EMAIL_PATTERN.test(value);
};

export const isValidUsername = (value) => {
    return value.length >= 3 && value.length <= 30 && USERNAME_PATTERN.test(value);
};

export const isValidGender = (value) => {
    return value === "male" || value === "female";
};

export const escapeRegExp = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const parsePagination = (query = {}, defaultLimit = 20, maxLimit = 100) => {
    const parsedPage = Number.parseInt(query.page, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, maxLimit)
        : defaultLimit;

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

const validatePasswordValue = (password) => {
    if (password.length < 6) {
        return "Password must be at least 6 characters long";
    }

    if (password.length > 72) {
        return "Password must be at most 72 characters long";
    }

    if (!password.trim()) {
        return "Password must contain non-whitespace characters";
    }

    return null;
};

export const parseSecurityAnswers = (rawAnswers) => {
    if (!Array.isArray(rawAnswers)) {
        return {
            error: `Please choose ${MIN_SECURITY_ANSWERS}-${MAX_SECURITY_ANSWERS} security questions and provide answers`
        };
    }

    if (
        rawAnswers.length < MIN_SECURITY_ANSWERS ||
        rawAnswers.length > MAX_SECURITY_ANSWERS
    ) {
        return {
            error: `Please choose ${MIN_SECURITY_ANSWERS}-${MAX_SECURITY_ANSWERS} security questions and provide answers`
        };
    }

    const seenQuestionIds = new Set();
    const securityAnswers = [];

    for (const entry of rawAnswers) {
        if (!entry || typeof entry !== "object") {
            return { error: "Invalid security answer format" };
        }

        const questionId = asTrimmedString(entry.questionId);

        if (!isValidSecurityQuestionId(questionId)) {
            return { error: "Please choose a valid security question" };
        }

        if (seenQuestionIds.has(questionId)) {
            return { error: "Please choose different security questions" };
        }

        seenQuestionIds.add(questionId);

        const answer = normalizeSecurityAnswer(entry.answer);

        if (!answer) {
            return { error: "Please answer all selected security questions" };
        }

        if (answer.length > MAX_SECURITY_ANSWER_LENGTH) {
            return {
                error: `Security answers must be at most ${MAX_SECURITY_ANSWER_LENGTH} characters long`
            };
        }

        securityAnswers.push({
            questionId,
            answer
        });
    }

    return { value: securityAnswers };
};

export const validateRegisterInput = (body = {}) => {
    const fullname = asTrimmedString(body.fullname);
    const username = asTrimmedString(body.username);
    const email = asEmail(body.email);
    const gender = asTrimmedString(body.gender).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const profilepicture = asTrimmedString(body.profilepicture);

    if (!fullname || !username || !email || !gender || !password) {
        return { error: "Please provide all required fields" };
    }

    if (fullname.length > 80) {
        return { error: "Full name must be at most 80 characters long" };
    }

    if (!isValidUsername(username)) {
        return {
            error: "Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens"
        };
    }

    if (!isValidEmail(email)) {
        return { error: "Please provide a valid email address" };
    }

    if (!isValidGender(gender)) {
        return { error: "Gender must be either male or female" };
    }

    const passwordError = validatePasswordValue(password);

    if (passwordError) {
        return { error: passwordError };
    }

    if (profilepicture.length > MAX_PROFILE_PICTURE_LENGTH) {
        return { error: `Profile picture URL must be at most ${MAX_PROFILE_PICTURE_LENGTH} characters long` };
    }

    const parsedAnswers = parseSecurityAnswers(body.securityAnswers);

    if (parsedAnswers.error) {
        return { error: parsedAnswers.error };
    }

    return {
        value: {
            fullname,
            username,
            email,
            gender,
            password,
            profilepicture,
            securityAnswers: parsedAnswers.value
        }
    };
};

export const validateLoginInput = (body = {}) => {
    const email = asEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
        return { error: "Please provide email and password" };
    }

    if (!isValidEmail(email)) {
        return { error: "Please provide a valid email address" };
    }

    return {
        value: {
            email,
            password
        }
    };
};

export const validateMessageInput = (body = {}) => {
    const message = asTrimmedString(body.message);

    if (!message) {
        return { error: "Message is required" };
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return { error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters long` };
    }

    return {
        value: {
            message
        }
    };
};

export const validateRecoveryEmailInput = (body = {}) => {
    const email = asEmail(body.email);

    if (!email) {
        return { error: "Please provide your email address" };
    }

    if (!isValidEmail(email)) {
        return { error: "Please provide a valid email address" };
    }

    return { value: { email } };
};

export const validatePasswordResetInput = (body = {}) => {
    const emailResult = validateRecoveryEmailInput(body);

    if (emailResult.error) {
        return emailResult;
    }

    const newPassword = typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!newPassword) {
        return { error: "Please provide a new password" };
    }

    const passwordError = validatePasswordValue(newPassword);

    if (passwordError) {
        return { error: passwordError };
    }

    const parsedAnswers = parseSecurityAnswers(body.securityAnswers);

    if (parsedAnswers.error) {
        return { error: parsedAnswers.error };
    }

    return {
        value: {
            email: emailResult.value.email,
            newPassword,
            securityAnswers: parsedAnswers.value
        }
    };
};
