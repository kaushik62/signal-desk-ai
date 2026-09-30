import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { httpError } from './errorHandler.js';

export const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('No token');
    req.userId = jwt.verify(token, env.jwtSecret).sub;
    next();
  } catch {
    next(httpError(401, 'Please sign in to continue'));
  }
};

export const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const requireUuidParam = (req, res, next) =>
  isUuid(req.params.id) ? next() : next(httpError(404, 'Not found'));
