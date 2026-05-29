const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const rows = await db.query(
      'SELECT * FROM documents WHERE owner_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { doc_type, name, url, size_bytes, mime_type, application_id } = req.body;
    if (!doc_type || !name || !url)
      return res.status(422).json({ success: false, message: 'doc_type, name and url are required.' });
    const id = uuidv4();
    await db.execute(
      `INSERT INTO documents (id,owner_id,application_id,doc_type,name,url,size_bytes,mime_type)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, req.user.id, application_id||null, doc_type, name, url, size_bytes||null, mime_type||null]
    );
    res.status(201).json({ success: true, data: { id } });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT owner_id FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found.' });
    if (rows[0].owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    await db.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;