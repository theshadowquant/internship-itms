// dailyLogs.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { application_id, from, to } = req.query;
    let where = [], params = [];
    if (application_id) { where.push('application_id = ?'); params.push(application_id); }
    if (from) { where.push('log_date >= ?'); params.push(from); }
    if (to)   { where.push('log_date <= ?'); params.push(to); }
    const ws = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const rows = await db.query(`SELECT * FROM daily_logs ${ws} ORDER BY log_date DESC`, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('student'), async (req, res, next) => {
  try {
    const { application_id, log_date, check_in, check_out, hours_worked, work_summary, mood } = req.body;
    const id = uuidv4();
    await db.execute(
      `INSERT INTO daily_logs (id,application_id,log_date,check_in,check_out,hours_worked,work_summary,mood)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, application_id, log_date, check_in||null, check_out||null, hours_worked||null, work_summary, mood||'good']
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
});

router.patch('/:id/approve', authenticate, authorize('company','admin','superadmin'), async (req, res, next) => {
  try {
    const { approved, note } = req.body;
    await db.execute(
      'UPDATE daily_logs SET is_approved = ?, supervisor_note = ? WHERE id = ?',
      [approved, note||null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;