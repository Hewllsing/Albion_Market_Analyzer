import { findUserById } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const header = request.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Autenticacao obrigatoria.', 401);

  const payload = verifyToken(token);
  const user = await findUserById(payload.sub);
  if (!user) throw new AppError('Usuario nao encontrado.', 401);
  request.user = user;
  next();
});
