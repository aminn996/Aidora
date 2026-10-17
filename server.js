const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { z } = require('zod');
require('dotenv').config();
const { pool, connectDB } = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.BETTER_AUTH_SECRET;
if (!JWT_SECRET) throw new Error('BETTER_AUTH_SECRET is required');

const origins = (process.env.FRONTEND_URL || '').split(',').map((value) => value.trim()).filter(Boolean);
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(128), role: z.enum(['client', 'provider']).optional() });
const serviceSchema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(2000).optional(), category: z.string().trim().min(2).max(60), price: z.coerce.number().min(0), image: z.string().url().optional().or(z.literal('')) });

function sign(user) { return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }
function publicUser(user) { const { password_hash, ...safe } = user; return safe; }
function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.auth = jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ message: 'Invalid or expired session' }); }
}
function role(...roles) { return (req, res, next) => roles.includes(req.auth.role) ? next() : res.status(403).json({ message: 'Insufficient permissions' }); }

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'neon', timestamp: new Date().toISOString() }));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const input = userSchema.parse(req.body);
  const hash = await bcrypt.hash(input.password, 12);
  const result = await pool.query('INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [input.name, input.email, hash, input.role || 'client']);
  const user = result.rows[0]; res.status(201).json({ user, token: sign(user) });
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [input.email.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ user: publicUser(user), token: sign(user) });
}));

async function findOrCreateGoogleUser(profile) {
  const email = profile.email.toLowerCase();
  const existing = await pool.query('SELECT id,name,email,role,phone,profile_picture,location,created_at,updated_at FROM users WHERE email=$1', [email]);
  if (existing.rows[0]) {
    const result = await pool.query('UPDATE users SET name=$1,profile_picture=COALESCE($2,profile_picture),updated_at=NOW() WHERE id=$3 RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [profile.name, profile.picture || null, existing.rows[0].id]);
    return result.rows[0];
  }
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const result = await pool.query('INSERT INTO users (name,email,password_hash,profile_picture) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [profile.name, email, passwordHash, profile.picture || null]);
  return result.rows[0];
}

app.get('/api/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.status(503).json({ message: 'Google authentication is not configured' });
  const frontendUrl = (process.env.FRONTEND_URL || req.headers.origin || '').split(',')[0].trim().replace(/\/$/, '');
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', access_type: 'online', prompt: 'select_account' });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', asyncRoute(async (req, res) => {
  const code = z.string().min(1).parse(req.query.code);
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  if (!tokenResponse.ok) return res.status(401).json({ message: 'Google authentication failed' });
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) return res.status(401).json({ message: 'Google profile lookup failed' });
  const profile = await profileResponse.json();
  if (!profile.email || !profile.email_verified) return res.status(401).json({ message: 'A verified Google email is required' });
  const user = await findOrCreateGoogleUser({ email: profile.email, name: profile.name || profile.email.split('@')[0], picture: profile.picture });
  const frontendUrl = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`).split(',')[0].trim().replace(/\/$/, '');
  res.redirect(`${frontendUrl}/?oauth_token=${encodeURIComponent(sign(user))}`);
}));
app.get('/api/auth/me', auth, asyncRoute(async (req, res) => { const result = await pool.query('SELECT id,name,email,role,phone,profile_picture,location,created_at,updated_at FROM users WHERE id=$1', [req.auth.sub]); if (!result.rows[0]) return res.status(404).json({ message: 'User not found' }); res.json({ user: result.rows[0] }); }));
app.put('/api/auth/profile', auth, asyncRoute(async (req, res) => { const input = z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(30).optional(), profilePicture: z.string().url().optional(), location: z.record(z.any()).optional() }).parse(req.body); const result = await pool.query('UPDATE users SET name=COALESCE($1,name),phone=COALESCE($2,phone),profile_picture=COALESCE($3,profile_picture),location=COALESCE($4,location),updated_at=NOW() WHERE id=$5 RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [input.name, input.phone, input.profilePicture, input.location ? JSON.stringify(input.location) : null, req.auth.sub]); res.json({ user: result.rows[0] }); }));
app.get('/api/services', asyncRoute(async (req, res) => { const values = []; let query = 'SELECT s.*, u.name AS provider_name FROM services s JOIN users u ON u.id=s.provider_id WHERE s.is_active=true'; if (req.query.category) { values.push(req.query.category); query += ` AND s.category=$${values.length}`; } values.push(Math.min(Number(req.query.limit) || 50, 100)); query += ` ORDER BY s.created_at DESC LIMIT $${values.length}`; const result = await pool.query(query, values); res.json({ services: result.rows }); }));
app.post('/api/services', auth, role('provider','admin'), asyncRoute(async (req, res) => { const input = serviceSchema.parse(req.body); const result = await pool.query('INSERT INTO services (provider_id,title,description,category,price,image) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.auth.sub,input.title,input.description || '',input.category,input.price,input.image || null]); res.status(201).json({ service: result.rows[0] }); }));
app.get('/api/services/:id', asyncRoute(async (req, res) => { const result = await pool.query('SELECT s.*, u.name AS provider_name FROM services s JOIN users u ON u.id=s.provider_id WHERE s.id=$1 AND s.is_active=true', [req.params.id]); if (!result.rows[0]) return res.status(404).json({ message: 'Service not found' }); res.json({ service: result.rows[0] }); }));
app.get('/api/bookings', auth, asyncRoute(async (req, res) => { const result = await pool.query('SELECT b.*, s.title, u.name AS provider_name FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.provider_id WHERE b.client_id=$1 OR b.provider_id=$1 ORDER BY b.created_at DESC', [req.auth.sub]); res.json({ bookings: result.rows }); }));
app.post('/api/bookings', auth, asyncRoute(async (req, res) => { const input = z.object({ serviceId: z.string().uuid(), scheduledAt: z.string().datetime().optional(), notes: z.string().max(2000).optional() }).parse(req.body); const service = await pool.query('SELECT provider_id FROM services WHERE id=$1 AND is_active=true', [input.serviceId]); if (!service.rows[0]) return res.status(404).json({ message: 'Service not found' }); const result = await pool.query('INSERT INTO bookings (service_id,client_id,provider_id,scheduled_at,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *', [input.serviceId,req.auth.sub,service.rows[0].provider_id,input.scheduledAt || null,input.notes || null]); res.status(201).json({ booking: result.rows[0] }); }));
app.use((err, req, res, next) => { if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid request', issues: err.issues }); if (err.code === '23505') return res.status(409).json({ message: 'A record with that value already exists' }); console.error(err); res.status(500).json({ message: 'Internal server error' }); });

if (require.main === module) connectDB().then(() => app.listen(PORT, () => console.log(`Aidora API listening on ${PORT}`))).catch((error) => { console.error(error); process.exit(1); });
module.exports = app;
