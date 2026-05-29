// tasks.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { application_id, status } = req.query;
    let where = [], params = [];
    if (application_id) { where.push('it.application_id = ?'); params.push(application_id); }
    if (status)         { where.push('it.status = ?');          params.push(status); }
    const ws = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const rows = await db.query(
      `SELECT it.*, u.first_name AS assignor_name FROM internship_tasks it
       JOIN users u ON u.id = it.assigned_by ${ws} ORDER BY it.due_date ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, authorize('company','admin','superadmin'),
  [body('application_id').notEmpty(), body('title').notEmpty()],
  async (req, res, next) => {
    try {
      const { application_id, title, description, priority, due_date } = req.body;
      const id = uuidv4();
      await db.execute(
        `INSERT INTO internship_tasks (id, application_id, assigned_by, title, description, priority, due_date)
         VALUES (?,?,?,?,?,?,?)`,
        [id, application_id, req.user.id, title, description||null, priority||'medium', due_date||null]
      );
      res.status(201).json({ success: true, data: { id } });
    } catch (err) { next(err); }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { status, score, feedback } = req.body;
    const sets = [], params = [];
    if (status)   { sets.push('status = ?');   params.push(status);   }
    if (score !== undefined) { sets.push('score = ?'); params.push(score); }
    if (feedback) { sets.push('feedback = ?'); params.push(feedback); }
    if (status === 'completed') { sets.push('completed_at = NOW()'); }
    if (!sets.length) return res.status(422).json({ success: false, message: 'Nothing to update.' });
    params.push(req.params.id);
    await db.execute(`UPDATE internship_tasks SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;