// performance.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { application_id } = req.query;
    const rows = await db.query(
      `SELECT pr.*, u.first_name AS reviewer_name FROM performance_reviews pr
       JOIN users u ON u.id = pr.reviewer_id
       WHERE pr.application_id = ? ORDER BY pr.created_at DESC`,
      [application_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('company','admin','superadmin'), async (req, res, next) => {
  try {
    const {
      application_id, review_type, technical_score, communication,
      teamwork, punctuality, initiative, overall_score, strengths, improvements, remarks
    } = req.body;
    const id = uuidv4();
    await db.execute(
      `INSERT INTO performance_reviews
       (id,application_id,reviewer_id,review_type,technical_score,communication,
        teamwork,punctuality,initiative,overall_score,strengths,improvements,remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, application_id, req.user.id, review_type, technical_score||null,
       communication||null, teamwork||null, punctuality||null, initiative||null,
       overall_score||null, strengths||null, improvements||null, remarks||null]
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
});

module.exports = router;