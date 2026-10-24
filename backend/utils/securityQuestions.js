export const MIN_SECURITY_ANSWERS = 2;
export const MAX_SECURITY_ANSWERS = 3;
export const MAX_SECURITY_ANSWER_LENGTH = 120;

export const SECURITY_QUESTIONS = Object.freeze([
    {
        id: "first_pet",
        question: "What was the name of your first pet?"
    },
    {
        id: "birth_city",
        question: "What city were you born in?"
    },
    {
        id: "first_school",
        question: "What was the name of your first school?"
    },
    {
        id: "childhood_nickname",
        question: "What was your childhood nickname?"
    },
    {
        id: "mother_maiden",
        question: "What is your mother's maiden name?"
    },
    {
        id: "favorite_teacher",
        question: "What was the name of your favorite teacher?"
    }
]);

export const SECURITY_QUESTION_IDS = Object.freeze(
    SECURITY_QUESTIONS.map((item) => item.id)
);

const questionById = new Map(
    SECURITY_QUESTIONS.map((item) => [item.id, item])
);

// Used for accounts that have no recovery questions configured. Returning a
// valid-looking set keeps the recovery endpoint from revealing which emails
// belong to existing accounts.
export const DEFAULT_RECOVERY_QUESTION_IDS = Object.freeze([
    "first_pet",
    "birth_city",
    "first_school"
]);

export const getSecurityQuestion = (questionId) => {
    return questionById.get(questionId) || null;
};

export const isValidSecurityQuestionId = (questionId) => {
    return questionById.has(questionId);
};

/**
 * Normalize answers so harmless differences (case, surrounding/inner
 * whitespace, Unicode compatibility forms) still verify.
 */
export const normalizeSecurityAnswer = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};
