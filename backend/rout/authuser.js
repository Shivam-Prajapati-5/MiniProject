import express from "express";
import {
    userLogin,
    userRegister,
    userLogout,
    getUsers,
    getCurrentUser,
    getSocketToken,
    getRecoveryQuestionCatalog,
    getRecoveryQuestions,
    resetPasswordWithSecurityAnswers
} from "../routControlers/userroutControler.js";
import isLogin from "../middleware/isLogin.js";
import {
    authLimiter,
    recoveryLimiter
} from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, userRegister);

router.post("/login", authLimiter, userLogin);

router.post("/logout", userLogout);

router.get("/recovery/catalog", getRecoveryQuestionCatalog);

router.post("/recovery/questions", recoveryLimiter, getRecoveryQuestions);

router.post("/recovery/reset", recoveryLimiter, resetPasswordWithSecurityAnswers);

router.get("/me", isLogin, getCurrentUser);

router.get("/socket-token", isLogin, getSocketToken);

router.get("/users", isLogin, getUsers);

export default router;
