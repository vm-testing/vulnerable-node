import rateLimit from 'express-rate-limit';

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
});

// General API rate limiter: 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
