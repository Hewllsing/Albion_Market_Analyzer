import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const scrypt = promisify(scryptCallback);

const base64url = (value) => Buffer.from(value).toString('base64url');

const parseBase64url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (value) => createHmac('sha256', env.auth.jwtSecret).update(value).digest('base64url');

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(String(password), salt, 64);
  return { salt, hash: Buffer.from(hash).toString('hex') };
};

export const verifyPassword = async ({ password, salt, hash }) => {
  const candidate = await scrypt(String(password), salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (stored.length !== candidate.length) return false;
  return timingSafeEqual(stored, candidate);
};

export const createToken = (user) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + env.auth.tokenTtlSeconds,
  };
  const body = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  return `${body}.${sign(body)}`;
};

export const verifyToken = (token) => {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new AppError('Token invalido.', 401);
  const [header, payload, signature] = parts;
  const body = `${header}.${payload}`;
  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new AppError('Token invalido.', 401);
  }
  const parsed = JSON.parse(parseBase64url(payload));
  if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError('Sessao expirada.', 401);
  }
  return parsed;
};

export const createResetToken = () => randomBytes(32).toString('base64url');

export const hashResetToken = (token) => createHash('sha256').update(String(token)).digest('hex');
