const router  = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db      = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ success: false, errors: e.array() });
  next();
};

// Helper — emit notification (fire-and-forget)
async function notify(userId, type, title, body, actionUrl) {
  try {
    await db.execute(
      'INSERT INTO notifications (id, user_id, type, title, body, action_url) VALUES (?,?,?,?,?,?)',
      [uuidv4(), userId, type, title, body || null, actionUrl || null]
    );
  } catch {}
}

// ── GET /applications  ────────────────────────────────────
// Student: their own; Company: applications for their internships; Admin: all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, internship_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [], params = [];

    if (req.user.role === 'student') {
      const sp = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);
      where.push('a.student_id = ?'); params.push(sp[0]?.id);
    } else if (req.user.role === 'company') {
      const cp = await db.query('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]);
      where.push('i.company_id = ?'); params.push(cp[0]?.id);
    }
    if (status)        { where.push('a.status = ?');          params.push(status); }
    if (internship_id) { where.push('a.internship_id = ?');   params.push(internship_id); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRows = await db.query(
      `SELECT COUNT(*) AS total FROM applications a
       JOIN internships i ON i.id = a.internship_id ${whereStr}`, params
    );
    const rows = await db.query(
      `SELECT a.*, i.title AS internship_title, i.location, i.stipend_min, i.stipend_max,
              c.company_name, c.logo_url,
              u.first_name, u.last_name, u.email AS student_email,
              sp.college_name, sp.gpa, sp.skills, sp.profile_score
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN company_profiles c ON c.id = i.company_id
       JOIN student_profiles sp ON sp.id = a.student_id
       JOIN users u ON u.id = sp.user_id
       ${whereStr}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows, meta: { total: countRows[0].total, page: parseInt(page) } });
  } catch (err) { next(err); }
});

// ── POST /applications  (student applies) ────────────────
router.post('/',
  authenticate, authorize('student'),
  audit('application.create', 'application'),
  [body('internship_id').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const sp = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);
      if (!sp.length) return res.status(400).json({ success: false, message: 'Complete your profile first.' });

      const intr = await db.query(
        'SELECT id, status, application_deadline FROM internships WHERE id = ?',
        [req.body.internship_id]
      );
      if (!intr.length || intr[0].status !== 'active')
        return res.status(400).json({ success: false, message: 'Internship not available.' });

      if (intr[0].application_deadline && new Date(intr[0].application_deadline) < new Date())
        return res.status(400).json({ success: false, message: 'Application deadline passed.' });

      const id = uuidv4();
      const history = JSON.stringify([{ stage: 'applied', ts: new Date().toISOString() }]);
      await db.execute(
        `INSERT INTO applications (id, internship_id, student_id, cover_letter, resume_url, stage_history)
         VALUES (?,?,?,?,?,?)`,
        [id, req.body.internship_id, sp[0].id, req.body.cover_letter || null, req.body.resume_url || null, history]
      );
      await db.execute(
        'UPDATE internships SET applications_count = applications_count + 1 WHERE id = ?',
        [req.body.internship_id]
      );

      res.status(201).json({ success: true, data: { id } });
    } catch (err) { next(err); }
  }
);

// ── PATCH /applications/:id/status  (company / admin) ────
router.patch('/:id/status',
  authenticate, authorize('company','admin','superadmin'),
  audit('application.status_change', 'application'),
  async (req, res, next) => {
    try {
      const { status, note, interview_date, interview_link, offer_letter_url } = req.body;
      const validStatuses = ['shortlisted','interview_scheduled','interview_done','offer_sent','hired','rejected'];
      if (!validStatuses.includes(status))
        return res.status(422).json({ success: false, message: 'Invalid status.' });

      const rows = await db.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });

      const app = rows[0];
      const history = JSON.parse(app.stage_history || '[]');
      history.push({ stage: status, ts: new Date().toISOString(), note: note || null });

      await db.execute(
        `UPDATE applications
         SET status = ?, stage_history = ?, rejection_reason = ?,
             interview_date = ?, interview_link = ?, offer_letter_url = ?
         WHERE id = ?`,
        [
          status, JSON.stringify(history),
          status === 'rejected' ? (note || null) : null,
          interview_date || null, interview_link || null,
          offer_letter_url || null,
          req.params.id,
        ]
      );

      // Get student user_id for notification
      const studentUser = await db.query(
        'SELECT u.id FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE sp.id = ?',
        [app.student_id]
      );
      if (studentUser.length) {
        const titleMap = {
          shortlisted: '🎉 You\'ve been shortlisted!',
          interview_scheduled: '📅 Interview scheduled',
          offer_sent: '🎁 Offer letter sent!',
          hired: '✅ Congratulations! You\'re hired!',
          rejected: 'Application update',
        };
        await notify(
          studentUser[0].id,
          'application_update',
          titleMap[status] || 'Application status updated',
          note || `Your application status changed to: ${status}`,
          `/applications/${req.params.id}`
        );
      }

      res.json({ success: true, message: 'Status updated.' });
    } catch (err) { next(err); }
  }
);

// ── GET /applications/:id  (full detail) ─────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const rows = await db.query(
      `SELECT a.*,
              i.title AS internship_title, i.description AS internship_desc, i.skills_required,
              i.location, i.stipend_min, i.stipend_max, i.duration_weeks,
              c.company_name, c.logo_url, c.website,
              u.first_name, u.last_name, u.email AS student_email, u.avatar_url,
              sp.college_name, sp.gpa, sp.skills, sp.portfolio_url, sp.resume_url AS profile_resume
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN company_profiles c ON c.id = i.company_id
       JOIN student_profiles sp ON sp.id = a.student_id
       JOIN users u ON u.id = sp.user_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;