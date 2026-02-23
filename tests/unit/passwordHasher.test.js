import { PasswordHasher } from '../../src/infrastructure/security/PasswordHasher.js';

describe('PasswordHasher', () => {
    describe('hash', () => {
        it('should generate a hash string', async () => {
            const hash = await PasswordHasher.hash('testpassword');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
            expect(hash).not.toBe('testpassword');
        });

        it('should generate different hashes for same password', async () => {
            const hash1 = await PasswordHasher.hash('testpassword');
            const hash2 = await PasswordHasher.hash('testpassword');
            expect(hash1).not.toBe(hash2); // Argon2 uses random salt
        });
    });

    describe('verify', () => {
        it('should return true for correct password', async () => {
            const hash = await PasswordHasher.hash('correctpassword');
            const result = await PasswordHasher.verify('correctpassword', hash);
            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const hash = await PasswordHasher.hash('correctpassword');
            const result = await PasswordHasher.verify('wrongpassword', hash);
            expect(result).toBe(false);
        });

        it('should return false for invalid hash', async () => {
            const result = await PasswordHasher.verify('password', 'not-a-valid-hash');
            expect(result).toBe(false);
        });
    });
});
