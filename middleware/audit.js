const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/**
 * Writes an audit record. Fire-and-forget (non-blocking).
 */
const audit = (action, entityType = null) => async (req, res, next) => {
  // Capture response body via monkey-patch
  const origJson = res.json.bind(res);
  let respBody;
  res.json = (body) => { respBody = body; return origJson(body); };

  res.on('finish', async () => {
    try {
      await db.execute(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          action,
          entityType,
          req.params?.id || respBody?.data?.id || null,
          JSON.stringify(req.body || {}),
          req.ip,
          req.headers['user-agent'] || '',
        ]
      );
    } catch { /* silent — audit must not break main flow */ }
  });

  next();
};

module.exports = { audit };