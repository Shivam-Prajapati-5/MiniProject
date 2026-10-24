import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE_MS,
    authCookieOptions
} from "./authCookie.js";

export const SOCKET_TOKEN_TTL_SECONDS = 5 * 60;
export const SOCKET_TOKEN_SCOPE = "socket";

export const createSocketToken = (userId, tokenVersion = 0) => {
    return jwt.sign(
        {
            userId,
            tokenVersion,
            scope: SOCKET_TOKEN_SCOPE
        },
        env.jwtSecret,
        {
            expiresIn: SOCKET_TOKEN_TTL_SECONDS
        }
    );
};

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
