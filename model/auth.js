import db from './db.js';
import { PasswordHasher } from '../src/infrastructure/security/PasswordHasher.js';

async function do_auth(username, password) {
    console.log('[AUTH] Starting authentication for user:', username);

    // Only query by username - we verify password separately with argon2
    const q = "SELECT * FROM users WHERE name = $1";
    const user = await db.oneOrNone(q, [username]);

    if (!user) {
        console.log('[AUTH] User not found');
        throw new Error("Invalid credentials");
    }

    // Verify password against argon2 hash
    const isValid = await PasswordHasher.verify(password, user.password);
    if (!isValid) {
        console.log('[AUTH] Invalid password');
        throw new Error("Invalid credentials");
    }

    console.log('[AUTH] Authentication successful');
    return user;
}

export default do_auth;
