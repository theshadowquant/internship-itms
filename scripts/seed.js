/**
 * ShadowQuant Dynamics – ITMS Database Seeder Script
 * Inserts rich, realistic test data for all roles and scenarios
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seeding...');
  // Let MySQL connection establish first (increased for remote cloud latency)
  await new Promise(resolve => setTimeout(resolve, 2500));

  try {
    // 0. Clear old data (disabled in production, safe for dev setup)
    console.log('🧹 Cleaning old records...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'rate_limit_buckets', 'audit_logs', 'notifications', 'documents',
      'performance_reviews', 'daily_logs', 'internship_tasks', 'applications',
      'internships', 'company_profiles', 'student_profiles', 'users', 'tenants'
    ];
    for (const t of tables) {
      await db.execute(`TRUNCATE TABLE ${t}`);
    }
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 1. Tenants (colleges / universities)
    console.log('🏢 Seeding tenants...');
    const tAdminId = '00000000-0000-0000-0000-000000000001'; // Default ShadowQuant Tenant
    const tBietId  = '00000000-0000-0000-0000-000000000002'; // BIET College
    const tRvceId  = '00000000-0000-0000-0000-000000000003'; // RVCE College

    await db.execute(
      `INSERT INTO tenants (id, name, domain, plan) VALUES
       (?, 'ShadowQuant Dynamics', 'shadowquant.io', 'enterprise'),
       (?, 'Bapuji Institute of Engineering and Technology', 'biet.edu', 'pro'),
       (?, 'RV College of Engineering', 'rvce.edu', 'enterprise')`,
      [tAdminId, tBietId, tRvceId]
    );

    // Hash passwords: Admin@123, Student@123, Employer@123
    const hashAdmin    = await bcrypt.hash('Admin@123', 10);
    const hashStudent  = await bcrypt.hash('Student@123', 10);
    const hashCompany  = await bcrypt.hash('Employer@123', 10);

    // 2. Users
    console.log('👤 Seeding users...');
    const uSuperAdminId = '00000000-0000-0000-0000-000000000010';
    const uBietAdminId  = '00000000-0000-0000-0000-000000000020';
    const uRvceAdminId  = '00000000-0000-0000-0000-000000000030';
    const uGoogleHrId   = '00000000-0000-0000-0000-000000000040';
    const uNovaHrId     = '00000000-0000-0000-0000-000000000050';
    const uArjunId      = '00000000-0000-0000-0000-000000000060';
    const uAnanyaId     = '00000000-0000-0000-0000-000000000070';

    await db.execute(
      `INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
       (?, ?, 'admin@shadowquant.io', ?, 'superadmin', 'Shadow', 'Admin', TRUE, TRUE),
       (?, ?, 'placement@biet.edu', ?, 'admin', 'BIET', 'Placement Cell', TRUE, TRUE),
       (?, ?, 'placement@rvce.edu', ?, 'admin', 'RVCE', 'Placement Center', TRUE, TRUE),
       (?, NULL, 'hr@google.com', ?, 'company', 'Google', 'Recruiter', TRUE, TRUE),
       (?, NULL, 'hr@technova.io', ?, 'company', 'TechNova', 'HR Coordinator', TRUE, TRUE),
       (?, ?, 'arjun@biet.edu', ?, 'student', 'Arjun', 'Sharma', TRUE, TRUE),
       (?, ?, 'ananya@rvce.edu', ?, 'student', 'Ananya', 'Rao', TRUE, TRUE)`,
      [
        uSuperAdminId, tAdminId, hashAdmin,
        uBietAdminId, tBietId, hashAdmin,
        uRvceAdminId, tRvceId, hashAdmin,
        uGoogleHrId, hashCompany,
        uNovaHrId, hashCompany,
        uArjunId, tBietId, hashStudent,
        uAnanyaId, tRvceId, hashStudent
      ]
    );

    // 3. Student Profiles
    console.log('🎓 Seeding student profiles...');
    const pArjunId  = '00000000-0000-0000-0001-000000000001';
    const pAnanyaId = '00000000-0000-0000-0001-000000000002';

    await db.execute(
      `INSERT INTO student_profiles (id, user_id, college_name, degree, branch, graduation_year, gpa, skills, bio, availability, expected_stipend, location_pref, profile_score) VALUES
       (?, ?, 'Bapuji Institute of Engineering and Technology', 'B.Tech', 'Computer Science', 2026, 8.70, ?, ?, 'immediate', 50000, ?, 82),
       (?, ?, 'RV College of Engineering', 'B.E.', 'Information Science', 2026, 9.20, ?, ?, '1_month', 60000, ?, 90)`,
      [
        pArjunId, uArjunId,
        JSON.stringify(["JavaScript", "Node.js", "React", "MySQL", "Python", "Git", "REST APIs", "Express.js", "Docker", "Java"]),
        'Full-stack developer with a passion for backend systems and scalable APIs.',
        JSON.stringify(["Bangalore", "Remote"]),
        pAnanyaId, uAnanyaId,
        JSON.stringify(["Python", "Machine Learning", "FastAPI", "SQL", "Pandas", "Scikit-Learn", "Git"]),
        'Aspiring ML engineer interested in building smart data pipelines and architectures.',
        JSON.stringify(["Remote", "Hyderabad"])
      ]
    );

    // 4. Company Profiles
    console.log('🏢 Seeding company profiles...');
    const cGoogleId = '00000000-0000-0000-0002-000000000001';
    const cNovaId   = '00000000-0000-0000-0002-000000000002';

    await db.execute(
      `INSERT INTO company_profiles (id, user_id, company_name, industry, size_range, website, logo_url, description, location, founded_year, is_verified, rating) VALUES
       (?, ?, 'Google', 'Technology', '500+', 'https://google.com', 'G', 'Global technology leader in search, hardware, and artificial intelligence.', 'Bangalore', 1998, TRUE, 4.8),
       (?, ?, 'TechNova Solutions', 'Software Services', '51-200', 'https://technova.io', 'TN', 'Next-generation software consulting and custom product engineering.', 'Bangalore', 2018, TRUE, 4.2)`,
      [
        cGoogleId, uGoogleHrId,
        cNovaId, uNovaHrId
      ]
    );

    // 5. Internships
    console.log('💼 Seeding internships...');
    const iGoogleSweId  = '00000000-0000-0000-0003-000000000001';
    const iNovaBackId   = '00000000-0000-0000-0003-000000000002';
    const iGoogleDataId = '00000000-0000-0000-0003-000000000003';

    await db.execute(
      `INSERT INTO internships (id, company_id, tenant_id, title, description, responsibilities, requirements, skills_required, domain, location, is_remote, duration_weeks, stipend_min, stipend_max, openings, min_gpa, eligible_branches, application_deadline, start_date, status) VALUES
       (?, ?, ?, 'Software Engineering Intern', 'SWE Intern role in the Google Cloud Platform systems team.', 'Write high-quality system designs and APIs.\nCollaborate on Go/Kubernetes architectures.', 'Proficient in algorithms and backend code structures.', ?, 'Backend Engineering', 'Bangalore', FALSE, 12, 80000, 100000, 5, 8.00, ?, '2026-12-15', '2027-01-10', 'active'),
       (?, ?, ?, 'Backend Engineering Intern', 'Build high performance REST APIs and database layers for enterprise clients.', 'Implement CRUD modules and SQL migrations.\nWrite Jest integration tests.', 'Prior experience with Node.js and SQL.', ?, 'Backend Engineering', 'Bangalore', FALSE, 12, 30000, 40000, 2, 7.50, ?, '2026-06-30', '2026-07-15', 'active'),
       (?, ?, ?, 'Data Engineering Intern', 'Develop pipeline architectures for big data processing at Google scales.', 'Design big data batch pipelines using PySpark.', 'High SQL skills and Python knowledge.', ?, 'Data Engineering', 'Hyderabad', TRUE, 16, 60000, 75000, 1, 8.50, ?, '2026-10-30', '2026-11-15', 'pending_approval')`,
      [
        iGoogleSweId, cGoogleId, tRvceId,
        JSON.stringify(["Python","Go","Kubernetes"]),
        JSON.stringify(["CSE", "ISE", "ECE"]),
        iNovaBackId, cNovaId, tBietId,
        JSON.stringify(["Node.js","MySQL","REST APIs"]),
        JSON.stringify(["CSE", "ISE"]),
        iGoogleDataId, cGoogleId, tRvceId,
        JSON.stringify(["Python","Spark","Kafka"]),
        JSON.stringify(["CSE", "ISE", "ECE"])
      ]
    );

    // 6. Applications
    console.log('📊 Seeding applications...');
    const aArjunGoogleId = '00000000-0000-0000-0004-000000000001';
    const aArjunNovaId   = '00000000-0000-0000-0004-000000000002';
    const aAnanyaGoogleId = '00000000-0000-0000-0004-000000000003';

    await db.execute(
      `INSERT INTO applications (id, internship_id, student_id, cover_letter, resume_url, status, stage_history, match_score, created_at) VALUES
       (?, ?, ?, 'I would love to join Google as an engineering intern.', 'https://drive.google.com/resume.pdf', 'shortlisted', ?, 94, DATE_SUB(NOW(), INTERVAL 14 DAY)),
       (?, ?, ?, 'Highly motivated CSE student eager to write backend Express APIs.', 'https://drive.google.com/resume.pdf', 'hired', ?, 92, DATE_SUB(NOW(), INTERVAL 28 DAY)),
       (?, ?, ?, 'Data enthusiast looking to join Google Big Data teams.', 'https://drive.google.com/resume.pdf', 'applied', ?, 88, DATE_SUB(NOW(), INTERVAL 5 DAY))`,
      [
        aArjunGoogleId, iGoogleSweId, pArjunId,
        JSON.stringify([
          { stage: 'applied', ts: DATE_OFFSET(-14), note: 'Applied via portal' },
          { stage: 'shortlisted', ts: DATE_OFFSET(-10), note: 'Impressive GPA and skills' }
        ]),
        aArjunNovaId, iNovaBackId, pArjunId,
        JSON.stringify([
          { stage: 'applied', ts: DATE_OFFSET(-28), note: 'Applied via BIET drive' },
          { stage: 'shortlisted', ts: DATE_OFFSET(-24) },
          { stage: 'interview_scheduled', ts: DATE_OFFSET(-20) },
          { stage: 'offer_sent', ts: DATE_OFFSET(-10) },
          { stage: 'hired', ts: DATE_OFFSET(-7), note: 'Onboarding starting Jun 1' }
        ]),
        aAnanyaGoogleId, iGoogleSweId, pAnanyaId,
        JSON.stringify([
          { stage: 'applied', ts: DATE_OFFSET(-5) }
        ])
      ]
    );

    // Update internships applications count
    await db.execute('UPDATE internships SET applications_count = 2 WHERE id = ?', [iGoogleSweId]);
    await db.execute('UPDATE internships SET applications_count = 1 WHERE id = ?', [iNovaBackId]);

    // 7. Internship Tasks
    console.log('📋 Seeding internship tasks...');
    await db.execute(
      `INSERT INTO internship_tasks (id, application_id, assigned_by, title, description, priority, status, due_date, completed_at, score, feedback) VALUES
       (UUID(), ?, ?, 'Design DB Schema for Orders', 'Create normalized MySQL schema with proper foreign key constraints and index fields.', 'high', 'completed', ?, DATE_SUB(NOW(), INTERVAL 1 DAY), 95, 'Excellent database normalization and logical indexes.'),
       (UUID(), ?, ?, 'Build REST API — Product Module', 'Implement express routes with server pagination, sorting, and field filtering.', 'medium', 'in_progress', ?, NULL, NULL, NULL),
       (UUID(), ?, ?, 'Write unit tests (Jest) — Auth module', 'Write Jest unit tests covering boundary edge scenarios for register/login.', 'high', 'todo', ?, NULL, NULL, NULL)`,
      [
        aArjunNovaId, uNovaHrId, DATE_OFFSET(-2),
        aArjunNovaId, uNovaHrId, DATE_OFFSET(3),
        aArjunNovaId, uNovaHrId, DATE_OFFSET(7)
      ]
    );

    // 8. Daily Logs
    console.log('⏱ Seeding daily logs...');
    await db.execute(
      `INSERT INTO daily_logs (id, application_id, log_date, check_in, check_out, hours_worked, work_summary, mood, is_approved, supervisor_note) VALUES
       (UUID(), ?, CURDATE(), '09:15:00', '18:30:00', 9.25, 'Completed order schema migration and fixed 3 failing Jest tests.', 'great', NULL, NULL),
       (UUID(), ?, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:30:00', '18:00:00', 8.50, 'Started REST API for product module, code is 60% complete.', 'good', TRUE, 'Great work. Continue packaging the API logic.'),
       (UUID(), ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:45:00', '19:00:00', 9.25, 'Reviewed teammate payment integrations PR and raised 12 improvement suggestions.', 'good', TRUE, 'Thorough review details, thanks.')`,
      [
        aArjunNovaId,
        aArjunNovaId,
        aArjunNovaId
      ]
    );

    // 9. Performance Reviews
    console.log('⭐ Seeding performance reviews...');
    await db.execute(
      `INSERT INTO performance_reviews (id, application_id, reviewer_id, review_type, technical_score, communication, teamwork, punctuality, initiative, overall_score, strengths, improvements, remarks, is_shared_with_student) VALUES
       (UUID(), ?, ?, 'mid_term', 88, 75, 90, 95, 72, 82,
        'Arjun demonstrates exceptional problem-solving abilities and quickly adapts to new codebases. His database design skills are notably advanced for an intern level.',
        'Should focus more on documentation and writing cleaner commit messages. Proactive communication with the team during blockers needs improvement.',
        'Overall a very positive addition to the engineering team! Promising developer.', TRUE)`,
      [aArjunNovaId, uNovaHrId]
    );

    // 10. Documents
    console.log('📄 Seeding documents...');
    await db.execute(
      `INSERT INTO documents (id, owner_id, application_id, doc_type, name, url, size_bytes, mime_type, is_verified) VALUES
       (UUID(), ?, NULL, 'resume', 'Resume – Nov 2025', 'https://drive.google.com/resume.pdf', 250880, 'application/pdf', TRUE),
       (UUID(), ?, ?, 'offer_letter', 'Offer Letter – TechNova', 'https://drive.google.com/offer_letter.pdf', 184320, 'application/pdf', TRUE),
       (UUID(), ?, NULL, 'certificate', 'AWS Cloud Practitioner Certificate', 'https://aws.cert/cp.pdf', 524288, 'application/pdf', TRUE)`,
      [
        uArjunId,
        uArjunId, aArjunNovaId,
        uArjunId
      ]
    );

    // 11. Audit Logs
    console.log('📝 Seeding audit logs...');
    await db.execute(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_value, ip_address, user_agent) VALUES
       (?, 'auth.login', 'user', ?, '{"email":"arjun@biet.edu"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'),
       (?, 'application.create', 'application', ?, '{"internship_id":"00000000-0000-0000-0003-000000000002"}', '127.0.0.1', 'Mozilla/5.0')`,
      [
        uArjunId, uArjunId,
        uArjunId, aArjunNovaId
      ]
    );

    // 12. Notifications
    console.log('🔔 Seeding notifications...');
    await db.execute(
      `INSERT INTO notifications (id, user_id, type, title, body, action_url) VALUES
       (UUID(), ?, 'application_update', '🎉 You\\'ve been shortlisted!', 'Your application for SWE Intern at Google has been shortlisted.', '/applications'),
       (UUID(), ?, 'task_assigned', '📋 New task assigned', 'Supervisor HR Coordinator assigned: Design DB Schema for Orders.', '/tasks')`,
      [uArjunId, uArjunId]
    );

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Helpers
function DATE_OFFSET(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

seed();
