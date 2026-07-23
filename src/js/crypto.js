const DEFAULT_SECRET = 'elevate';
let activeSecret = DEFAULT_SECRET;

function encodeText(value) {
  return new TextEncoder().encode(value);
}

function decodeText(value) {
  return new TextDecoder().decode(value);
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveKey(secret) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
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
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodeText(payload)
  );

  return `${toBase64(iv)}.${toBase64(ciphertext)}`;
}

export async function decrypt(value, customSecret = activeSecret) {
  if (typeof value !== 'string' || !value.includes('.')) {
    throw new Error('Invalid encrypted payload.');
  }

  const [ivText, cipherText] = value.split('.');
  const key = await deriveKey(normalizeSecret(customSecret));
  const iv = fromBase64(ivText);
  const ciphertext = fromBase64(cipherText);
  const plaintext = await crypto.subtle.decrypt(
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
  return JSON.stringify(encrypted);
}

export async function decjson(json, customSecret = activeSecret) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  return transformJsonValue(parsed, normalizeSecret(customSecret), 'decrypt');
}
