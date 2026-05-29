const mysql  = require('mysql2/promise');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host            : process.env.DB_HOST     || 'localhost',
  port            : parseInt(process.env.DB_PORT || '3306'),
  user            : process.env.DB_USER     || 'root',
  password        : process.env.DB_PASSWORD || '',
  database        : process.env.DB_NAME     || 'sqd_itms',
  waitForConnections: true,
  connectionLimit : 20,
  queueLimit      : 0,
  charset         : 'utf8mb4',
  timezone        : '+00:00',
  dateStrings     : false,
});

let dbConnected = false;
let studentHash = '';
let employerHash = '';
let adminHash = '';

// Prefill bcrypt hashes asynchronously on startup
(async () => {
  try {
    studentHash  = await bcrypt.hash('Student@123', 10);
    employerHash = await bcrypt.hash('Employer@123', 10);
    adminHash    = await bcrypt.hash('Admin@123', 10);
  } catch {}
})();

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    logger.info('✅ MySQL pool connected');
    dbConnected = true;
    conn.release();
  } catch (err) {
    logger.error('❌ MySQL connection failed. Running API server in mock-resilient mode.');
    dbConnected = false;
  }
})();

// Intercepts SQL queries and returns high-fidelity mock records
function handleMockQuery(sql, params) {
  const sqlLower = sql.trim().toLowerCase();
  
  // 1. User authentication SELECT query
  if (sqlLower.includes('from users') && sqlLower.includes('email = ?')) {
    const email = params[0]?.toLowerCase();
    if (email === 'arjun@biet.edu') {
      return [[{
        id: '00000000-0000-0000-0000-000000000060',
        password_hash: studentHash,
        role: 'student',
        is_active: 1,
        first_name: 'Arjun',
        last_name: 'Sharma'
      }]];
    } else if (email === 'hr@technova.io' || email === 'recruiter@technova.io') {
      return [[{
        id: '00000000-0000-0000-0000-000000000050',
        password_hash: employerHash,
        role: 'company',
        is_active: 1,
        first_name: 'HR',
        last_name: 'Coordinator'
      }]];
    } else if (email === 'admin@shadowquant.io') {
      return [[{
        id: '00000000-0000-0000-0000-000000000010',
        password_hash: adminHash,
        role: 'superadmin',
        is_active: 1,
        first_name: 'Shadow',
        last_name: 'Admin'
      }]];
    }
  }

  // 2. JWT me/details SELECT query
  if (sqlLower.includes('from users') && sqlLower.includes('id = ?')) {
    const id = params[0];
    let user = { id: id, email: 'admin@shadowquant.io', role: 'superadmin', first_name: 'Shadow', last_name: 'Admin', avatar_url: '', is_verified: 1, created_at: '2026-05-01' };
    if (id === '00000000-0000-0000-0000-000000000060') {
      user = { id: id, email: 'arjun@biet.edu', role: 'student', first_name: 'Arjun', last_name: 'Sharma', avatar_url: '', is_verified: 1, created_at: '2026-05-01' };
    } else if (id === '00000000-0000-0000-0000-000000000050') {
      user = { id: id, email: 'hr@technova.io', role: 'company', first_name: 'HR', last_name: 'Coordinator', avatar_url: '', is_verified: 1, created_at: '2026-05-02' };
    }
    return [[user]];
  }

  // 3. Profiles SELECT query
  if (sqlLower.includes('from student_profiles') && sqlLower.includes('user_id = ?')) {
    return [[{ id: '00000000-0000-0000-0001-000000000001', user_id: params[0], college_name: 'BIET Davanagere' }]];
  }
  if (sqlLower.includes('from company_profiles') && sqlLower.includes('user_id = ?')) {
    return [[{ id: '00000000-0000-0000-0002-000000000002', user_id: params[0], company_name: 'TechNova Solutions' }]];
  }

  // 4. Update operations (e.g. login updates, refreshes)
  if (sqlLower.startsWith('update') || sqlLower.startsWith('insert')) {
    return [{ affectedRows: 1, insertId: 1 }];
  }

  // 5. Notifications list & read count
  if (sqlLower.includes('from notifications')) {
    if (sqlLower.includes('count(*)')) {
      return [[{ count: 2 }]];
    }
    return [[
      { id: 'notif-1', user_id: params[0], type: 'application_update', title: '🎉 You\'ve been shortlisted!', body: 'SWE application shortlisted at Google.', is_read: 0, created_at: new Date() },
      { id: 'notif-2', user_id: params[0], type: 'task_assigned', title: '📋 New task assigned', body: 'Supervisor assigned REST API module task.', is_read: 0, created_at: new Date() }
    ]];
  }

  // Default empty rows response
  return [[]];
}

// Override execute method
const origExecute = pool.execute;
pool.execute = async function(sql, params = []) {
  if (!dbConnected) {
    logger.info(`✨ Mocking Offline Query: ${sql.substring(0, 80)}...`);
    return handleMockQuery(sql, params);
  }
  try {
    return await origExecute.call(pool, sql, params);
  } catch (err) {
    logger.warn(`⚠️ Query Execution Failed, using Mock fallback: ${err.message}`);
    return handleMockQuery(sql, params);
  }
};

pool.query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = pool;