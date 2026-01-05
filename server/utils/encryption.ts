import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.SESSION_SECRET || 'a_very_secret_key_that_is_32_chars_long!!';

// Ensure the key is exactly 32 bytes for AES-256
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a string in the format: iv:ciphertext:tag
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypts a string previously encrypted with encrypt().
 */
export function decrypt(encryptedText: string): string {
    const [ivHex, ciphertext, tagHex] = encryptedText.split(':');

    if (!ivHex || !ciphertext || !tagHex) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Safely encrypts a value only if it's not null/undefined.
 */
export function safeEncrypt(value: string | null | undefined): string | null {
    if (!value) return null;
    return encrypt(value);
}

/**
 * Safely decrypts a value only if it's not null/undefined.
 * Returns original value if decryption fails (useful for transition).
 */
export function safeDecrypt(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        return decrypt(value);
    } catch (e) {
        // If it's not in our encrypted format, it might be a legacy plain-text token
        return value;
    }
}
