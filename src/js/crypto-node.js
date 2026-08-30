import { webcrypto } from 'node:crypto';

const DEFAULT_SECRET = 'elevate';
let activeSecret = DEFAULT_SECRET;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeText(value) {
  return encoder.encode(value);
}

function decodeText(value) {
  return decoder.decode(value);
}

function toBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value) {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

async function deriveKey(secret) {
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('elevate-crypto-v1'),
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function normalizeSecret(secret) {
  return secret || activeSecret || DEFAULT_SECRET;
}

function parseDecryptedValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

export function init(customSecret = DEFAULT_SECRET) {
  activeSecret = customSecret || DEFAULT_SECRET;
  return activeSecret;
}

export async function encrypt(value, customSecret = activeSecret) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  const key = await deriveKey(normalizeSecret(customSecret));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await webcrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodeText(payload)
  );

  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decrypt(value, customSecret = activeSecret) {
  if (typeof value !== 'string' || !value.includes('.')) {
    throw new Error('Invalid encrypted payload.');
  }

  const [ivText, cipherText] = value.split('.');
  const key = await deriveKey(normalizeSecret(customSecret));
  const iv = fromBase64(ivText);
  const ciphertext = fromBase64(cipherText);
  const plaintext = await webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  return parseDecryptedValue(decodeText(plaintext));
}

async function transformJsonValue(value, customSecret, mode) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => transformJsonValue(item, customSecret, mode)));
  }

  if (value && typeof value === 'object') {
    const transformed = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const transformedKey = mode === 'encrypt' ? await encrypt(key, customSecret) : await decrypt(key, customSecret);
      transformed[transformedKey] = await transformJsonValue(nestedValue, customSecret, mode);
    }

    return transformed;
  }

  return mode === 'encrypt' ? encrypt(value, customSecret) : decrypt(value, customSecret);
}

export async function encjson(json, customSecret = activeSecret) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  const encrypted = await transformJsonValue(parsed, normalizeSecret(customSecret), 'encrypt');
  return encrypted;
}

export async function decjson(json, customSecret = activeSecret) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return transformJsonValue(parsed, normalizeSecret(customSecret), 'decrypt');
}

export { DEFAULT_SECRET };
