import argon2 from 'argon2';

export class PasswordHasher {
    static async hash(plainPassword) {
        return await argon2.hash(plainPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        });
    }

    static async verify(plainPassword, hash) {
        try {
            return await argon2.verify(hash, plainPassword);
        } catch (error) {
            console.error('[PasswordHasher] Verification error:', error.message);
            return false;
        }
    }
}
