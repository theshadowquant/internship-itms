const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

const signAccess  = (id, role) =>
  jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
const signRefresh = (id) =>
  jwt.sign({ sub: id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// ── POST /api/v1/auth/register ────────────────────────────
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['student','company']),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { email, password, role, first_name, last_name, tenant_id } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();

    await db.execute(
      `INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tenant_id || null, email, hash, role, first_name, last_name]
    );

    // Create empty profile depending on role
    if (role === 'student') {
      await db.execute('INSERT INTO student_profiles (id, user_id) VALUES (?, ?)', [uuidv4(), id]);
    } else if (role === 'company') {
      await db.execute(
        'INSERT INTO company_profiles (id, user_id, company_name) VALUES (?, ?, ?)',
        [uuidv4(), id, req.body.company_name || 'My Company']
      );
    }

    const access  = signAccess(id, role);
    const refresh = signRefresh(id);
    await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refresh, id]);

    res.status(201).json({ success: true, data: { access_token: access, refresh_token: refresh, role, id } });
  } catch (err) { next(err); }
});

// ── POST /api/v1/auth/login ───────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const rows = await db.query(
      'SELECT id, password_hash, role, is_active, first_name, last_name FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const access  = signAccess(user.id, user.role);
    const refresh = signRefresh(user.id);
    await db.execute(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refresh, user.id]
    );

    res.json({
      success: true,
      data: {
        access_token: access,
        refresh_token: refresh,
        user: { id: user.id, role: user.role, first_name: user.first_name, last_name: user.last_name },
      },
    });
  } catch (err) { next(err); }
});

// ── POST /api/v1/auth/refresh ─────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const rows = await db.query('SELECT id, role, refresh_token FROM users WHERE id = ?', [decoded.sub]);
    if (!rows.length || rows[0].refresh_token !== refresh_token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const access = signAccess(rows[0].id, rows[0].role);
    res.json({ success: true, data: { access_token: access } });
  } catch (err) { next(err); }
});

// ── POST /api/v1/auth/logout ──────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await db.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) { next(err); }
});

// ── GET /api/v1/auth/me ───────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const rows = await db.query(
      'SELECT id, email, role, first_name, last_name, avatar_url, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;