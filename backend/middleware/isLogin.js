import jwt from "jsonwebtoken";
import User from "../Modes/useModels.js";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../utils/authCookie.js";

const isLogin = async (req, res, next) => {
    try {
        const token = req.cookies?.[AUTH_COOKIE_NAME];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User is not logged in"
            });
        }

        const decoded = jwt.verify(token, env.jwtSecret);

        // Socket handshake tokens are deliberately short-lived and must not
        // be usable as a browser session cookie.
        if (decoded.scope === "socket") {
            throw new Error("Socket token cannot be used as a session");
        }

        const user = await User.findById(decoded.userId).select("+tokenVersion");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        req.user = user;
        return next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export default isLogin;
