const router = require('express').Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// ── GET /analytics/overview  (admin) ──────────────────────
router.get('/overview', authenticate, authorize('admin','superadmin'), async (req, res, next) => {
  try {
    const [[totals]] = await Promise.all([
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'company') AS total_companies,
          (SELECT COUNT(*) FROM internships WHERE status = 'active') AS active_internships,
          (SELECT COUNT(*) FROM applications) AS total_applications,
          (SELECT COUNT(*) FROM applications WHERE status = 'hired') AS total_hired,
          (SELECT COUNT(*) FROM applications WHERE status IN ('shortlisted','interview_scheduled','offer_sent')) AS pipeline_count
      `)
    ]);

    const placement_rate = totals.total_applications > 0
      ? ((totals.total_hired / totals.total_applications) * 100).toFixed(1)
      : 0;

    // Applications by status
    const appByStatus = await db.query(
      `SELECT status, COUNT(*) AS count FROM applications GROUP BY status`
    );

    // Top companies by hires
    const topCompanies = await db.query(
      `SELECT c.company_name, c.logo_url, COUNT(a.id) AS hires
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN company_profiles c ON c.id = i.company_id
       WHERE a.status = 'hired'
       GROUP BY c.id ORDER BY hires DESC LIMIT 5`
    );

    // Monthly application trend (last 6 months)
    const trend = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM applications
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`
    );

    // Top skills demanded
    const skills = await db.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(skills_required, CONCAT('$[', idx, ']'))) AS skill,
              COUNT(*) AS count
       FROM internships,
            JSON_TABLE(JSON_ARRAY(0,1,2,3,4), '$[*]' COLUMNS(idx INT PATH '$')) AS t
       WHERE JSON_EXTRACT(skills_required, CONCAT('$[', t.idx, ']')) IS NOT NULL
         AND status = 'active'
       GROUP BY skill ORDER BY count DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totals: { ...totals, placement_rate },
        app_by_status: appByStatus,
        top_companies: topCompanies,
        monthly_trend: trend,
        top_skills    : skills,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /analytics/student  (student's own) ───────────────
router.get('/student', authenticate, authorize('student'), async (req, res, next) => {
  try {
    const sp = await db.query('SELECT id FROM student_profiles WHERE user_id = ?', [req.user.id]);
    if (!sp.length) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const appSummary = await db.query(
      `SELECT status, COUNT(*) AS count FROM applications WHERE student_id = ? GROUP BY status`,
      [sp[0].id]
    );

    const taskSummary = await db.query(
      `SELECT it.status, COUNT(*) AS count
       FROM internship_tasks it
       JOIN applications a ON a.id = it.application_id
       WHERE a.student_id = ?
       GROUP BY it.status`,
      [sp[0].id]
    );

    const performance = await db.query(
      `SELECT pr.overall_score, pr.review_type, pr.created_at
       FROM performance_reviews pr
       JOIN applications a ON a.id = pr.application_id
       WHERE a.student_id = ?
       ORDER BY pr.created_at DESC LIMIT 5`,
      [sp[0].id]
    );

    res.json({ success: true, data: { app_summary: appSummary, task_summary: taskSummary, performance } });
  } catch (err) { next(err); }
});

// ── GET /analytics/company  (company's own) ───────────────
router.get('/company', authenticate, authorize('company'), async (req, res, next) => {
  try {
    const cp = await db.query('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]);
    if (!cp.length) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const stats = await db.query(
      `SELECT
         COUNT(DISTINCT i.id) AS total_postings,
         COUNT(a.id) AS total_applications,
         SUM(a.status = 'hired') AS total_hired,
         SUM(i.status = 'active') AS active_postings
       FROM internships i
       LEFT JOIN applications a ON a.internship_id = i.id
       WHERE i.company_id = ?`,
      [cp[0].id]
    );

    const funnel = await db.query(
      `SELECT a.status, COUNT(*) AS count
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       WHERE i.company_id = ?
       GROUP BY a.status`,
      [cp[0].id]
    );

    res.json({ success: true, data: { stats: stats[0], funnel } });
  } catch (err) { next(err); }
});

module.exports = router;