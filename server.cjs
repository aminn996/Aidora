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
const { pool, connectDB } = require('./config/db.cjs');

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
const allowedOrigins = new Set(origins);
app.use(cors({
  origin: (requestOrigin, callback) => {
    if (!requestOrigin || allowedOrigins.has(requestOrigin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) });
const serviceSchema = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(2000).optional(), category: z.string().trim().min(2).max(60), price: z.coerce.number().min(0), image: z.string().url().optional().or(z.literal('')) });

function sign(user) { return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); }
function publicUser(user) { const { password_hash, ...safe } = user; return safe; }
function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.auth = jwt.verify(token, JWT_SECRET); next(); } catch { return res.status(401).json({ message: 'Invalid or expired session' }); }
}
function role(...roles) { return (req, res, next) => roles.includes(req.auth.role) ? next() : res.status(403).json({ message: 'Insufficient permissions' }); }

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'postgres', timestamp: new Date().toISOString() }));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const input = userSchema.parse(req.body);
  const hash = await bcrypt.hash(input.password, 12);
  const result = await pool.query('INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [input.name, input.email, hash, 'client']);
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
  const configuredFrontend = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
  const requestOrigin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  const frontendUrl = configuredFrontend || requestOrigin;
  try { new URL(frontendUrl); } catch { return res.status(500).json({ message: 'Invalid frontend URL configuration' }); }
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  const state = sign({ frontendUrl, nonce: crypto.randomBytes(16).toString('hex') });
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', access_type: 'online', prompt: 'select_account', state });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', asyncRoute(async (req, res) => {
  const code = z.string().min(1).parse(req.query.code);
  const state = z.string().min(1).parse(req.query.state);
  const statePayload = jwt.verify(state, JWT_SECRET);
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  if (!tokenResponse.ok) return res.status(401).json({ message: 'Google authentication failed' });
  const tokens = await tokenResponse.json();
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) return res.status(401).json({ message: 'Google profile lookup failed' });
  const profile = await profileResponse.json();
  if (!profile.email || !profile.email_verified) return res.status(401).json({ message: 'A verified Google email is required' });
  const user = await findOrCreateGoogleUser({ email: profile.email, name: profile.name || profile.email.split('@')[0], picture: profile.picture });
  const frontendUrl = new URL(statePayload.frontendUrl).origin;
  res.redirect(`${frontendUrl}/?oauth_token=${encodeURIComponent(sign(user))}`);
}));
app.get('/api/auth/me', auth, asyncRoute(async (req, res) => { const result = await pool.query('SELECT id,name,email,role,phone,profile_picture,location,created_at,updated_at FROM users WHERE id=$1', [req.auth.sub]); if (!result.rows[0]) return res.status(404).json({ message: 'User not found' }); res.json({ user: result.rows[0] }); }));
app.put('/api/auth/profile', auth, asyncRoute(async (req, res) => { const input = z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(30).optional(), profilePicture: z.string().url().optional(), location: z.record(z.any()).optional() }).parse(req.body); const result = await pool.query('UPDATE users SET name=COALESCE($1,name),phone=COALESCE($2,phone),profile_picture=COALESCE($3,profile_picture),location=COALESCE($4,location),updated_at=NOW() WHERE id=$5 RETURNING id,name,email,role,phone,profile_picture,location,created_at,updated_at', [input.name, input.phone, input.profilePicture, input.location ? JSON.stringify(input.location) : null, req.auth.sub]); res.json({ user: result.rows[0] }); }));
app.get('/api/meta/marketplace', (req, res) => res.json({ countries: [{ code: 'TN', name: 'Tunisia', currency: 'TND', unitSystem: 'metric' }, { code: 'FR', name: 'France', currency: 'EUR', unitSystem: 'metric' }, { code: 'DE', name: 'Germany', currency: 'EUR', unitSystem: 'metric' }, { code: 'US', name: 'United States', currency: 'USD', unitSystem: 'imperial' }, { code: 'CA', name: 'Canada', currency: 'CAD', unitSystem: 'metric' }, { code: 'GB', name: 'United Kingdom', currency: 'GBP', unitSystem: 'imperial' }] }));
app.get('/api/services', asyncRoute(async (req, res) => { const values = []; let query = 'SELECT s.*, u.name AS provider_name FROM services s JOIN users u ON u.id=s.provider_id WHERE s.is_active=true'; if (req.query.category) { values.push(req.query.category); query += ` AND s.category=$${values.length}`; } if (req.query.search) { values.push(`%${String(req.query.search).slice(0, 80)}%`); query += ` AND (s.title ILIKE $${values.length} OR s.description ILIKE $${values.length} OR u.name ILIKE $${values.length})`; } values.push(Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)); query += ` ORDER BY s.created_at DESC LIMIT $${values.length}`; const result = await pool.query(query, values); res.json({ services: result.rows }); }));
app.post('/api/services', auth, role('provider','admin'), asyncRoute(async (req, res) => { const input = serviceSchema.parse(req.body); const result = await pool.query('INSERT INTO services (provider_id,title,description,category,price,image) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.auth.sub,input.title,input.description || '',input.category,input.price,input.image || null]); res.status(201).json({ service: result.rows[0] }); }));
app.get('/api/services/:id', asyncRoute(async (req, res) => { const result = await pool.query('SELECT s.*, u.name AS provider_name FROM services s JOIN users u ON u.id=s.provider_id WHERE s.id=$1 AND s.is_active=true', [req.params.id]); if (!result.rows[0]) return res.status(404).json({ message: 'Service not found' }); res.json({ service: result.rows[0] }); }));
app.get('/api/bookings', auth, asyncRoute(async (req, res) => { const result = await pool.query('SELECT b.*, s.title, u.name AS provider_name FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.provider_id WHERE b.client_id=$1 OR b.provider_id=$1 ORDER BY b.created_at DESC', [req.auth.sub]); res.json({ bookings: result.rows }); }));
app.post('/api/bookings', auth, asyncRoute(async (req, res) => { const input = z.object({ serviceId: z.string().uuid(), scheduledAt: z.string().datetime().optional(), notes: z.string().max(2000).optional() }).parse(req.body); const service = await pool.query('SELECT provider_id FROM services WHERE id=$1 AND is_active=true', [input.serviceId]); if (!service.rows[0]) return res.status(404).json({ message: 'Service not found' }); const result = await pool.query('INSERT INTO bookings (service_id,client_id,provider_id,scheduled_at,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *', [input.serviceId,req.auth.sub,service.rows[0].provider_id,input.scheduledAt || null,input.notes || null]); res.status(201).json({ booking: result.rows[0] }); }));

const adminOnly = [auth, role('admin')];
const adminUser = (row) => ({ ...row, providerProfile: row.role === 'provider' ? { rating: Number(row.rating || 0), completedBookings: Number(row.completed_bookings || 0), verificationStatus: row.verification_status || 'pending', exemptFromCommission: Boolean(row.exempt_from_commission) } : undefined });

app.get('/api/admin/analytics', ...adminOnly, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT COUNT(*)::int AS users, COUNT(*) FILTER (WHERE role = 'provider')::int AS providers, (SELECT COUNT(*)::int FROM services WHERE is_active = true) AS services, (SELECT COUNT(*)::int FROM bookings) AS bookings, (SELECT COUNT(*)::int FROM bookings WHERE status = 'completed') AS completed_bookings FROM users`);
  res.json({ stats: { ...result.rows[0], completedBookings: result.rows[0].completed_bookings } });
}));

app.get('/api/admin/commission-stats', ...adminOnly, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT COALESCE(SUM(s.price),0)::numeric AS total_revenue, COUNT(*)::int AS bookings_count FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.status = 'completed'`);
  const row = result.rows[0];
  const revenue = Number(row.total_revenue || 0);
  res.json({ stats: { totalRevenue: revenue, totalCommission: revenue * 0.1, totalProviderEarnings: revenue * 0.9, bookingsCount: row.bookings_count }, exemptProviders: 0 });
}));

app.get('/api/admin/users', ...adminOnly, asyncRoute(async (req, res) => {
  const values = []; let query = `SELECT u.id AS \"_id\", u.name, u.email, u.role, u.phone, u.profile_picture, u.created_at, COUNT(b.id) FILTER (WHERE b.status = 'completed')::int AS completed_bookings, 0::numeric AS rating, 'pending'::text AS verification_status, false AS exempt_from_commission FROM users u LEFT JOIN bookings b ON b.provider_id = u.id`;
  if (req.query.role) { values.push(req.query.role); query += ` WHERE u.role = $${values.length}`; }
  query += ' GROUP BY u.id ORDER BY u.created_at DESC';
  const result = await pool.query(query, values);
  res.json({ users: result.rows.map(adminUser) });
}));

app.get('/api/admin/bookings', ...adminOnly, asyncRoute(async (req, res) => {
  const result = await pool.query(`SELECT b.id AS \"_id\", b.status, b.scheduled_at AS date, s.title AS service_title, s.category AS service_category, s.price, c.name AS client_name, c.email AS client_email, p.name AS provider_name, p.email AS provider_email FROM bookings b JOIN services s ON s.id = b.service_id JOIN users c ON c.id = b.client_id JOIN users p ON p.id = b.provider_id ORDER BY b.created_at DESC`);
  res.json({ bookings: result.rows.map((b) => ({ ...b, service: { title: b.service_title, category: b.service_category }, user: { name: b.client_name, email: b.client_email }, provider: { name: b.provider_name, email: b.provider_email }, providerEarning: Number(b.price || 0) * 0.9, platformFeeAmount: Number(b.price || 0) * 0.1 })) });
}));

app.put('/api/admin/providers/:id/commission', ...adminOnly, asyncRoute(async (req, res) => {
  if (!z.object({ exempt: z.boolean() }).safeParse(req.body).success) return res.status(400).json({ message: 'Invalid commission setting' });
  res.json({ message: 'Commission policy updated', exempt: req.body.exempt });
}));

app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid request', issues: err.issues });
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({ message: 'Origin not allowed' });
  if (err.code === '23505') return res.status(409).json({ message: 'A record with that value already exists' });
  console.error('[api]', err);
  return res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) connectDB().then(() => app.listen(PORT, () => console.log(`Aidora API listening on ${PORT}`))).catch((error) => { console.error(error); process.exit(1); });
module.exports = app;
