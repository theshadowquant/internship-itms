const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, authorize, tenantGuard } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const validate = (req, res, next) => {
    const e = validationResult(req);
    if (!e.isEmpty()) return res.status(422).json({ success: false, errors: e.array() });
    next();
};

// ── GET /internships  (paginated, filterable) ─────────────
router.get('/', authenticate, async (req, res, next) => {
    try {
        const {
            page = 1, limit = 20, search, domain, location, is_remote,
            stipend_min, skills, status = 'active', sort = 'created_at', order = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allowed = ['created_at', 'stipend_min', 'application_deadline', 'views'];
        const sortCol = allowed.includes(sort) ? sort : 'created_at';
        const sortDir = order === 'asc' ? 'ASC' : 'DESC';

        let where = ['i.status = ?'];
        const params = [status];

        if (search) {
            where.push('MATCH(i.title, i.description, i.domain) AGAINST(? IN BOOLEAN MODE)');
            params.push(`${search}*`);
        }
        if (domain) { where.push('i.domain = ?'); params.push(domain); }
        if (location) { where.push('i.location LIKE ?'); params.push(`%${location}%`); }
        if (is_remote !== undefined) { where.push('i.is_remote = ?'); params.push(is_remote === 'true'); }
        if (stipend_min) { where.push('i.stipend_max >= ?'); params.push(parseInt(stipend_min)); }

        const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const countRows = await db.query(
            `SELECT COUNT(*) AS total FROM internships i ${whereStr}`, params
        );
        const rows = await db.query(
            `SELECT i.*, c.company_name, c.logo_url, c.rating AS company_rating
       FROM internships i
       JOIN company_profiles c ON c.id = i.company_id
       ${whereStr}
       ORDER BY i.is_featured DESC, i.${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            success: true,
            data: rows,
            meta: { total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) },
        });
    } catch (err) { next(err); }
});

// ── GET /internships/:id ──────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const rows = await db.query(
            `SELECT i.*, c.company_name, c.logo_url, c.description AS company_desc,
              c.website, c.location AS company_location, c.rating AS company_rating
       FROM internships i
       JOIN company_profiles c ON c.id = i.company_id
       WHERE i.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Internship not found.' });

        // Increment view
        db.execute('UPDATE internships SET views = views + 1 WHERE id = ?', [req.params.id]);

        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
});

// ── POST /internships  (company only) ────────────────────
router.post('/',
    authenticate,
    authorize('company'),
    audit('internship.create', 'internship'),
    [
        body('title').notEmpty().trim(),
        body('description').notEmpty(),
        body('duration_weeks').isInt({ min: 1 }),
        body('openings').optional().isInt({ min: 1 }),
    ],
    validate,
    async (req, res, next) => {
        try {
            const cp = await db.query('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]);
            if (!cp.length) return res.status(400).json({ success: false, message: 'Company profile not found.' });

            const {
                title, description, responsibilities, requirements,
                skills_required, domain, location, is_remote = false,
                duration_weeks, stipend_min, stipend_max, openings = 1,
                min_gpa, eligible_branches, application_deadline, start_date,
            } = req.body;

            const id = uuidv4();
            await db.execute(
                `INSERT INTO internships
         (id, company_id, title, description, responsibilities, requirements,
          skills_required, domain, location, is_remote, duration_weeks,
          stipend_min, stipend_max, openings, min_gpa, eligible_branches,
          application_deadline, start_date, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending_approval')`,
                [
                    id, cp[0].id, title, description, responsibilities || null,
                    requirements || null,
                    JSON.stringify(skills_required || []),
                    domain || null, location || null, is_remote, duration_weeks,
                    stipend_min || null, stipend_max || null, openings,
                    min_gpa || null,
                    JSON.stringify(eligible_branches || []),
                    application_deadline || null, start_date || null,
                ]
            );

            res.status(201).json({ success: true, data: { id } });
        } catch (err) { next(err); }
    }
);

// ── PATCH /internships/:id/status  (admin) ────────────────
router.patch('/:id/status',
    authenticate,
    authorize('admin', 'superadmin'),
    audit('internship.status_change', 'internship'),
    async (req, res, next) => {
        try {
            const { status, admin_note } = req.body;
            const allowed = ['active', 'paused', 'closed', 'rejected', 'pending_approval'];
            if (!allowed.includes(status))
                return res.status(422).json({ success: false, message: 'Invalid status.' });

            await db.execute(
                'UPDATE internships SET status = ?, admin_note = ? WHERE id = ?',
                [status, admin_note || null, req.params.id]
            );
            res.json({ success: true, message: 'Status updated.' });
        } catch (err) { next(err); }
    }
);

// ── DELETE /internships/:id  (company owner or admin) ────
router.delete('/:id',
    authenticate,
    audit('internship.delete', 'internship'),
    async (req, res, next) => {
        try {
            const rows = await db.query(
                `SELECT i.id, cp.user_id FROM internships i
         JOIN company_profiles cp ON cp.id = i.company_id
         WHERE i.id = ?`,
                [req.params.id]
            );
            if (!rows.length) return res.status(404).json({ success: false, message: 'Not found.' });

            const canDelete =
                ['admin', 'superadmin'].includes(req.user.role) ||
                rows[0].user_id === req.user.id;

            if (!canDelete) return res.status(403).json({ success: false, message: 'Forbidden.' });

            await db.execute('DELETE FROM internships WHERE id = ?', [req.params.id]);
            res.json({ success: true, message: 'Internship deleted.' });
        } catch (err) { next(err); }
    }
);

module.exports = router;