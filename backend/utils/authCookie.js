import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "jwt";
export const AUTH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const baseCookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProduction,
    path: "/"
};

export const authCookieOptions = Object.freeze({
    ...baseCookieOptions,
    maxAge: AUTH_COOKIE_MAX_AGE_MS
});

export const clearAuthCookieOptions = Object.freeze({
    ...baseCookieOptions
});
