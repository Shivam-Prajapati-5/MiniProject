import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE_MS,
    authCookieOptions
} from "./authCookie.js";

const jwtToken = (userId, res, tokenVersion = 0) => {
    const token = jwt.sign(
        { userId, tokenVersion },
        env.jwtSecret,
        {
            expiresIn: "30d"
        }
    );

    res.cookie(AUTH_COOKIE_NAME, token, {
        ...authCookieOptions,
        maxAge: AUTH_COOKIE_MAX_AGE_MS
    });

    return token;
};

export default jwtToken;
