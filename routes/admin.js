const router = require('express').Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin/superadmin
router.use(authenticate, authorize('admin','superadmin'));

// ── GET /admin/users ──────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { page=1, limit=20, role, search, is_active } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let where = [], params = [];
    if (role)      { where.push('role = ?');                  params.push(role); }
    if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active === 'true'); }
    if (search)    { where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
                     params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    const ws = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRows = await db.query(`SELECT COUNT(*) AS total FROM users ${ws}`, params);
    const rows = await db.query(
      `SELECT id, email, role, first_name, last_name, is_active, is_verified, last_login, created_at
       FROM users ${ws} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows, meta: { total: countRows[0].total } });
  } catch (err) { next(err); }
});

// ── PATCH /admin/users/:id/toggle-active ─────────────────
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    await db.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── GET /admin/audit-logs ─────────────────────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page=1, limit=50, action } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    let where = [], params = [];
    if (action) { where.push('al.action LIKE ?'); params.push(`%${action}%`); }
    const ws = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const rows = await db.query(
      `SELECT al.*, u.email AS actor_email, u.role AS actor_role
       FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_id
       ${ws} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── GET /admin/pending-internships ────────────────────────
router.get('/pending-internships', async (req, res, next) => {
  try {
    const rows = await db.query(
      `SELECT i.*, c.company_name, c.logo_url, c.is_verified AS company_verified
       FROM internships i JOIN company_profiles c ON c.id = i.company_id
       WHERE i.status = 'pending_approval' ORDER BY i.created_at ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── GET /admin/tenants ────────────────────────────────────
router.get('/tenants', async (req, res, next) => {
  try {
    const rows = await db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;