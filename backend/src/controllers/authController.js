import { env } from '../config/env.js';
import {
  consumePasswordReset,
  createPasswordReset,
  createUser,
  findUserByEmail,
  getUserSettings,
  updateUserPassword,
} from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import {
  createResetToken,
  createToken,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from '../utils/auth.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const validatePassword = (password) => {
  if (!password || String(password).length < 8) {
    throw new AppError('A senha precisa ter ao menos 8 caracteres.', 400);
  }
};

export const register = async (request, response) => {
  const name = String(request.body.name || '').trim();
  const email = normalizeEmail(request.body.email);
  const password = String(request.body.password || '');
  if (!name) throw new AppError('Informe o nome.', 400);
  if (!email || !email.includes('@')) throw new AppError('Informe um email valido.', 400);
  validatePassword(password);
  if (await findUserByEmail(email)) throw new AppError('Este email ja esta cadastrado.', 409);

  const { hash, salt } = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash: hash, passwordSalt: salt });
  const settings = await getUserSettings(user.id);
  response.status(201).json({
    data: {
      token: createToken(user),
      user: publicUser(user),
      settings,
    },
  });
};

export const login = async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const password = String(request.body.password || '');
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword({
    password,
    salt: user.passwordSalt,
    hash: user.passwordHash,
  }))) {
    throw new AppError('Email ou senha invalidos.', 401);
  }
  const settings = await getUserSettings(user.id);
  response.json({
    data: {
      token: createToken(user),
      user: publicUser(user),
      settings,
    },
  });
};

export const getMe = async (request, response) => {
  response.json({
    data: {
      user: publicUser(request.user),
      settings: await getUserSettings(request.user.id),
    },
  });
};

export const requestPasswordReset = async (request, response) => {
  const email = normalizeEmail(request.body.email);
  const user = await findUserByEmail(email);
  if (!user) {
    response.json({ data: { message: 'Se o email existir, um link de recuperacao sera gerado.' } });
    return;
  }

  const resetToken = createResetToken();
  const expiresAt = new Date(Date.now() + env.auth.passwordResetTtlMinutes * 60_000);
  await createPasswordReset({ userId: user.id, token: resetToken, expiresAt });
  response.json({
    data: {
      message: 'Token de recuperacao gerado.',
      resetToken,
      expiresAt,
    },
  });
};

export const confirmPasswordReset = async (request, response) => {
  const token = String(request.body.token || '');
  const password = String(request.body.password || '');
  validatePassword(password);
  const reset = await consumePasswordReset(token);
  if (!reset) throw new AppError('Token de recuperacao invalido ou expirado.', 400);
  const { hash, salt } = await hashPassword(password);
  await updateUserPassword(reset.userId, { passwordHash: hash, passwordSalt: salt });
  response.json({ data: { message: 'Senha atualizada.' } });
};
