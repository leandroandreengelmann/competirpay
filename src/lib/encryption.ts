import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// A chave de criptografia DEVE ter 32 caracteres (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'cp_sec_key_32_chars_123456789012';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    if (!text) return "";
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error("Encryption error:", err);
        return text;
    }
}

export function decrypt(text: string): string {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        // Fallback para texto plano se a descriptografia falhar
        return text;
    }
}
