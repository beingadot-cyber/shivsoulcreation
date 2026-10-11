import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const calc = crypto.scryptSync(password, salt, 64);
  const orig = Buffer.from(hash, "hex");
  return calc.length === orig.length && crypto.timingSafeEqual(calc, orig);
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(mobile: string, otp: string): string {
  return sha256(`ssc-otp-v1:${mobile}:${otp}`);
}
