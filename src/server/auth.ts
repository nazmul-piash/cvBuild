import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const info = stmt.run(email, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    res.status(201).json({ message: 'User registered successfully', user: { id: info.lastInsertRowid, email } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Me
import { authenticateToken, AuthRequest } from './middleware.ts';
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
