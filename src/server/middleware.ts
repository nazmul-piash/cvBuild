import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
