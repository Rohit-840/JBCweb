import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey() {
  return crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET)
    .digest();
}

// Encrypted strings are stored as:  {32-hex iv}:{32-hex authTag}:{hex ciphertext}
export function isEncrypted(str) {
  if (!str || typeof str !== "string") return false;
  const parts = str.split(":");
  return (
    parts.length === 3 &&
    /^[0-9a-f]{32}$/i.test(parts[0]) &&
    /^[0-9a-f]{32}$/i.test(parts[1]) &&
    parts[2].length > 0
  );
}

export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedStr) {
  const key = getKey();
  const [ivHex, authTagHex, ciphertext] = encryptedStr.split(":");

  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Returns plain text regardless of whether the stored value is encrypted or legacy plain text.
// If plain text is detected, also returns the encrypted form so the caller can migrate it.
export function safeDecrypt(storedPassword) {
  if (isEncrypted(storedPassword)) {
    return { plain: decrypt(storedPassword), needsMigration: false };
  }
  return { plain: storedPassword, needsMigration: true };
}
