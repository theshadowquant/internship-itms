// users.js
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// ── GET /users/profile  (own profile) ────────────────────
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const rows = await db.query(
        `SELECT u.*, sp.* FROM users u JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = ?`,
        [req.user.id]
      );
      return res.json({ success: true, data: rows[0] });
    }
    if (req.user.role === 'company') {
      const rows = await db.query(
        `SELECT u.*, cp.* FROM users u JOIN company_profiles cp ON cp.user_id = u.id WHERE u.id = ?`,
        [req.user.id]
      );
      return res.json({ success: true, data: rows[0] });
    }
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ── PATCH /users/profile  ─────────────────────────────────
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { first_name, last_name, phone, avatar_url } = req.body;
    const sets = [], params = [];
    if (first_name) { sets.push('first_name = ?'); params.push(first_name); }
    if (last_name)  { sets.push('last_name = ?');  params.push(last_name);  }
    if (phone)      { sets.push('phone = ?');       params.push(phone);      }
    if (avatar_url) { sets.push('avatar_url = ?'); params.push(avatar_url); }
    if (sets.length) {
      params.push(req.user.id);
      await db.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    // Student extended profile
    if (req.user.role === 'student') {
      const fields = ['college_name','degree','branch','graduation_year','gpa','skills','bio',
                      'portfolio_url','linkedin_url','github_url','resume_url','availability',
                      'expected_stipend','location_pref'];
      const setSP = [], pSP = [];
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          setSP.push(`${f} = ?`);
          pSP.push(typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
        }
      }
      if (setSP.length) {
        pSP.push(req.user.id);
        await db.execute(`UPDATE student_profiles SET ${setSP.join(', ')} WHERE user_id = ?`, pSP);
      }
    }

    // Company extended profile
    if (req.user.role === 'company') {
      const fields = ['company_name','industry','size_range','website','logo_url','description',
                      'location','founded_year','linkedin_url'];
      const setCP = [], pCP = [];
      for (const f of fields) {
        if (req.body[f] !== undefined) { setCP.push(`${f} = ?`); pCP.push(req.body[f]); }
      }
      if (setCP.length) {
        pCP.push(req.user.id);
        await db.execute(`UPDATE company_profiles SET ${setCP.join(', ')} WHERE user_id = ?`, pCP);
      }
    }

    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) { next(err); }
});

module.exports = router;