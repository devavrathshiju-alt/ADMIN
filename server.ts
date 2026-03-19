import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'ieee-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Database Setup
// WARNING: SQLite is NOT recommended for Vercel as it's a serverless environment and the filesystem is ephemeral.
// For production on Vercel, consider using Vercel Postgres, Supabase, or MongoDB.
const db = new Database('ieee_referral.db');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS crs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    referral_code TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (referral_code) REFERENCES crs(referral_code),
    UNIQUE(roll_number, event_id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hashedPassword);
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- API Routes ---

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin: any = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (admin && bcrypt.compareSync(password, admin.password)) {
      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Events API
  app.get('/api/events', (req, res) => {
    const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
    res.json(events);
  });

  app.post('/api/events', authenticate, (req, res) => {
    const { name, date, status } = req.body;
    const result = db.prepare('INSERT INTO events (name, date, status) VALUES (?, ?, ?)').run(name, date, status || 'active');
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/events/:id', authenticate, (req, res) => {
    const { name, date, status } = req.body;
    db.prepare('UPDATE events SET name = ?, date = ?, status = ? WHERE id = ?').run(name, date, status, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/events/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // CRs API
  app.get('/api/crs', (req, res) => {
    const crs = db.prepare('SELECT * FROM crs').all();
    res.json(crs);
  });

  app.post('/api/crs', authenticate, (req, res) => {
    const { name, class_name, referral_code } = req.body;
    try {
      const result = db.prepare('INSERT INTO crs (name, class_name, referral_code) VALUES (?, ?, ?)').run(name, class_name, referral_code);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'Referral code already exists' });
    }
  });

  app.put('/api/crs/:id', authenticate, (req, res) => {
    const { name, class_name, referral_code } = req.body;
    db.prepare('UPDATE crs SET name = ?, class_name = ?, referral_code = ? WHERE id = ?').run(name, class_name, referral_code, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/crs/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM crs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Registrations API
  app.post('/api/register', (req, res) => {
    const { student_name, roll_number, email, event_id, referral_code } = req.body;
    
    // Check if referral code exists
    const cr = db.prepare('SELECT * FROM crs WHERE referral_code = ?').get(referral_code);
    if (!cr) return res.status(400).json({ error: 'Invalid referral code' });

    // Check if event is active
    const event: any = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
    if (!event || event.status !== 'active') return res.status(400).json({ error: 'Event is not active' });

    try {
      const result = db.prepare(`
        INSERT INTO registrations (student_name, roll_number, email, event_id, referral_code)
        VALUES (?, ?, ?, ?, ?)
      `).run(student_name, roll_number, email, event_id, referral_code);
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'You have already registered for this event' });
      } else {
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  });

  // Analytics & Leaderboard
  app.get('/api/analytics/leaderboard/:eventId', (req, res) => {
    const { eventId } = req.params;
    const leaderboard = db.prepare(`
      SELECT crs.name, crs.class_name, crs.referral_code, COUNT(registrations.id) as count
      FROM crs
      LEFT JOIN registrations ON crs.referral_code = registrations.referral_code AND registrations.event_id = ?
      GROUP BY crs.referral_code
      ORDER BY count DESC
    `).all(eventId);
    res.json(leaderboard);
  });

  app.get('/api/analytics/registrations/:eventId', (req, res) => {
    const { eventId } = req.params;
    const registrations = db.prepare(`
      SELECT r.*, e.name as event_name, c.name as cr_name, c.class_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN crs c ON r.referral_code = c.referral_code
      WHERE r.event_id = ?
      ORDER BY r.timestamp DESC
    `).all(eventId);
    res.json(registrations);
  });

  // CR Dashboard API (Public but needs referral code)
  app.get('/api/cr/stats/:referralCode', (req, res) => {
    const { referralCode } = req.params;
    const cr: any = db.prepare('SELECT * FROM crs WHERE referral_code = ?').get(referralCode);
    if (!cr) return res.status(404).json({ error: 'CR not found' });

    const stats = db.prepare(`
      SELECT e.name as event_name, COUNT(r.id) as count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.referral_code = ?
      GROUP BY e.id
    `).all(referralCode);

    res.json({ cr, stats });
  });

  // --- Vite Integration ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });

  return app;
}

// Export for Vercel
export default startServer();
