import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errorHandler.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signIn = (res, user) => {
  res.cookie('token', jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' }), cookieOptions);
  return { user: { id: user.id, name: user.name, email: user.email } };
};

export async function register(req, res, next) {
  try {
    const body = req.body ?? {};
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (password.length < 8 || password.length > 72) errors.password = 'Password must be 8 to 72 characters';
    if (Object.keys(errors).length) throw httpError(400, 'Fix the highlighted fields', errors);

    try {
      const { rows: [user] } = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
        [name, email, await bcrypt.hash(password, 12)]
      );
      res.status(201).json(signIn(res, user));
    } catch (e) {
      if (e.code === '23505') throw httpError(409, 'An account with this email already exists', { email: 'Email already in use' });
      throw e;
    }
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const body = req.body ?? {};
    const email = String(body.email ?? '').trim().toLowerCase();
    const { rows: [user] } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const ok = user && (await bcrypt.compare(String(body.password ?? ''), user.password_hash));
    if (!ok) throw httpError(401, 'Incorrect email or password');
    res.json(signIn(res, user));
  } catch (err) {
    next(err);
  }
}

export const logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
};

export async function me(req, res, next) {
  try {
    const { rows: [user] } = await pool.query('SELECT id, name, email FROM users WHERE id=$1', [req.userId]);
    if (!user) throw httpError(401, 'Please sign in to continue');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
