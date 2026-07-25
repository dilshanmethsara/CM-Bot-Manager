import crypto from 'crypto';
import { BufferJSON } from '@whiskeysockets/baileys';
import { logger } from '../logger.js';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
  keyVersion: number;
}

function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment');
  }
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64 encoded)`);
  }
  return decoded;
}

function deriveKey(masterKey: Buffer, salt: Buffer, keyVersion: number): Buffer {
  const info = Buffer.from(`baileys-auth-v${keyVersion}`);
  const key = crypto.hkdfSync('sha256', masterKey, salt, info, KEY_LENGTH);
  return Buffer.isBuffer(key) ? key : Buffer.from(key);
}

export function encrypt(plaintext: string, keyVersion = 1): EncryptedData {
  const masterKey = getMasterKey();
  const saltArray = crypto.randomBytes(SALT_LENGTH);
  const ivArray = crypto.randomBytes(IV_LENGTH);
  const salt: Buffer = Buffer.isBuffer(saltArray) ? saltArray : Buffer.from(saltArray);
  const iv: Buffer = Buffer.isBuffer(ivArray) ? ivArray : Buffer.from(ivArray);
  const key = deriveKey(masterKey, salt, keyVersion);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion,
  };
}

export function decrypt(data: EncryptedData): string {
  const masterKey = getMasterKey();
  const key = deriveKey(masterKey, Buffer.from(data.salt, 'base64'), data.keyVersion);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(data.tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.encrypted, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function encryptJson<T>(obj: T, keyVersion = 1): EncryptedData {
  return encrypt(JSON.stringify(obj, BufferJSON.replacer), keyVersion);
}

export function decryptJson<T>(data: EncryptedData): T {
  return JSON.parse(decrypt(data), BufferJSON.reviver);
}

export function reEncrypt(data: EncryptedData, newKeyVersion: number): EncryptedData {
  const plaintext = decrypt(data);
  return encrypt(plaintext, newKeyVersion);
}

export function generateEncryptionKey(): string {
  const keyArray = crypto.randomBytes(KEY_LENGTH);
  const keyBuffer: Buffer = Buffer.isBuffer(keyArray) ? keyArray : Buffer.from(keyArray);
  return keyBuffer.toString('base64');
}

export function verifyEncryptionKey(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}
