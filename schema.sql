-- ============================================================
-- ShadowQuant Dynamics – ITMS Database Schema
-- Engine: MySQL 8.0+  |  Charset: utf8mb4
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS sqd_itms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE sqd_itms;

-- ─────────────────────────────────────────────
-- 1. TENANTS (multi-tenant: colleges / orgs)
-- ─────────────────────────────────────────────
CREATE TABLE tenants (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  name          VARCHAR(200)  NOT NULL,
  domain        VARCHAR(100)  UNIQUE,
  logo_url      TEXT,
  plan          ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  settings      JSON,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. USERS (role-based, multi-tenant)
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id     CHAR(36)      REFERENCES tenants(id) ON DELETE SET NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('student','company','admin','superadmin') NOT NULL,
  first_name    VARCHAR(100)  NOT NULL,
  last_name     VARCHAR(100)  NOT NULL,
  avatar_url    TEXT,
  phone         VARCHAR(20),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login    TIMESTAMP,
  refresh_token TEXT,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_tenant  (tenant_id),
  INDEX idx_users_role    (role),
  INDEX idx_users_email   (email)
);

-- ─────────────────────────────────────────────
-- 3. STUDENT PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE student_profiles (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id         CHAR(36)      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  college_name    VARCHAR(200),
  degree          VARCHAR(100),
  branch          VARCHAR(100),
  graduation_year YEAR,
  gpa             DECIMAL(4,2),
  skills          JSON,           -- ["Python","React","ML"]
  bio             TEXT,
  portfolio_url   TEXT,
  linkedin_url    TEXT,
  github_url      TEXT,
  resume_url      TEXT,
  availability    ENUM('immediate','1_month','3_months','not_available') DEFAULT 'immediate',
  expected_stipend INT,           -- INR per month
  location_pref   JSON,           -- ["Bangalore","Remote"]
  profile_score   TINYINT UNSIGNED DEFAULT 0,  -- 0-100
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sp_gpa    (gpa),
  FULLTEXT idx_sp_ft  (college_name, branch)
);

-- ─────────────────────────────────────────────
-- 4. COMPANY PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE company_profiles (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id         CHAR(36)      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name    VARCHAR(200)  NOT NULL,
  industry        VARCHAR(100),
  size_range      ENUM('1-10','11-50','51-200','201-500','500+'),
  website         TEXT,
  logo_url        TEXT,
  description     TEXT,
  location        VARCHAR(200),
  founded_year    YEAR,
  linkedin_url    TEXT,
  is_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  verification_doc TEXT,
  rating          DECIMAL(3,2)  DEFAULT 0.00,
  total_reviews   INT           DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 5. INTERNSHIPS
-- ─────────────────────────────────────────────
CREATE TABLE internships (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  company_id      CHAR(36)      NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  tenant_id       CHAR(36)      REFERENCES tenants(id) ON DELETE SET NULL,
  title           VARCHAR(200)  NOT NULL,
  description     TEXT          NOT NULL,
  responsibilities TEXT,
  requirements    TEXT,
  skills_required JSON,          -- ["Node.js","MySQL"]
  domain          VARCHAR(100),  -- "Backend Engineering"
  location        VARCHAR(200),
  is_remote       BOOLEAN       NOT NULL DEFAULT FALSE,
  duration_weeks  TINYINT UNSIGNED NOT NULL,
  stipend_min     INT,
  stipend_max     INT,
  openings        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  min_gpa         DECIMAL(3,2),
  eligible_branches JSON,
  application_deadline DATE,
  start_date      DATE,
  status          ENUM('draft','pending_approval','active','paused','closed','rejected') NOT NULL DEFAULT 'draft',
  admin_note      TEXT,
  views           INT           NOT NULL DEFAULT 0,
  applications_count INT        NOT NULL DEFAULT 0,
  is_featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_int_company  (company_id),
  INDEX idx_int_status   (status),
  INDEX idx_int_deadline (application_deadline),
  FULLTEXT idx_int_ft    (title, description, domain)
);

-- ─────────────────────────────────────────────
-- 6. APPLICATIONS (pipeline)
-- ─────────────────────────────────────────────
CREATE TABLE applications (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  internship_id   CHAR(36)      NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id      CHAR(36)      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  cover_letter    TEXT,
  resume_url      TEXT,
  status          ENUM('applied','shortlisted','interview_scheduled','interview_done','offer_sent','hired','rejected','withdrawn') NOT NULL DEFAULT 'applied',
  stage_history   JSON,           -- [{stage, timestamp, note}]
  interview_date  DATETIME,
  interview_link  TEXT,
  offer_letter_url TEXT,
  rejection_reason TEXT,
  match_score     TINYINT UNSIGNED DEFAULT 0,  -- AI match 0-100
  company_rating  TINYINT UNSIGNED,   -- company rates student 1-5
  company_note    TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (internship_id, student_id),
  INDEX idx_app_student   (student_id),
  INDEX idx_app_internship (internship_id),
  INDEX idx_app_status    (status)
);

-- ─────────────────────────────────────────────
-- 7. INTERNSHIP TASKS
-- ─────────────────────────────────────────────
CREATE TABLE internship_tasks (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  application_id  CHAR(36)      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  assigned_by     CHAR(36)      NOT NULL REFERENCES users(id),
  title           VARCHAR(300)  NOT NULL,
  description     TEXT,
  priority        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status          ENUM('todo','in_progress','under_review','completed','blocked') NOT NULL DEFAULT 'todo',
  due_date        DATE,
  completed_at    TIMESTAMP,
  score           TINYINT UNSIGNED,   -- 0-100 graded by supervisor
  feedback        TEXT,
  attachments     JSON,           -- [{name, url}]
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task_app   (application_id),
  INDEX idx_task_status (status)
);

-- ─────────────────────────────────────────────
-- 8. DAILY LOGS
-- ─────────────────────────────────────────────
CREATE TABLE daily_logs (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  application_id  CHAR(36)      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  log_date        DATE          NOT NULL,
  check_in        TIME,
  check_out       TIME,
  hours_worked    DECIMAL(4,2),
  work_summary    TEXT          NOT NULL,
  mood            ENUM('great','good','okay','difficult') DEFAULT 'good',
  is_approved     BOOLEAN       DEFAULT NULL,   -- NULL=pending
  supervisor_note TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_daily_log (application_id, log_date),
  INDEX idx_dl_app  (application_id),
  INDEX idx_dl_date (log_date)
);

-- ─────────────────────────────────────────────
-- 9. PERFORMANCE REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE performance_reviews (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  application_id  CHAR(36)      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id     CHAR(36)      NOT NULL REFERENCES users(id),
  review_type     ENUM('mid_term','final','self') NOT NULL,
  technical_score TINYINT UNSIGNED,    -- 0-100
  communication   TINYINT UNSIGNED,
  teamwork        TINYINT UNSIGNED,
  punctuality     TINYINT UNSIGNED,
  initiative      TINYINT UNSIGNED,
  overall_score   TINYINT UNSIGNED,
  strengths       TEXT,
  improvements    TEXT,
  remarks         TEXT,
  is_shared_with_student BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_app (application_id)
);

-- ─────────────────────────────────────────────
-- 10. DOCUMENTS
-- ─────────────────────────────────────────────
CREATE TABLE documents (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  owner_id        CHAR(36)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  CHAR(36)      REFERENCES applications(id) ON DELETE SET NULL,
  doc_type        ENUM('resume','offer_letter','certificate','nda','project_report','id_proof','other') NOT NULL,
  name            VARCHAR(300)  NOT NULL,
  url             TEXT          NOT NULL,
  size_bytes      INT,
  mime_type       VARCHAR(100),
  is_verified     BOOLEAN       DEFAULT FALSE,
  uploaded_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doc_owner (owner_id),
  INDEX idx_doc_app   (application_id)
);

-- ─────────────────────────────────────────────
-- 11. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id         CHAR(36)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(50)   NOT NULL,  -- 'application_update', 'task_assigned', etc.
  title           VARCHAR(300)  NOT NULL,
  body            TEXT,
  is_read         BOOLEAN       NOT NULL DEFAULT FALSE,
  action_url      TEXT,
  meta            JSON,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read)
);

-- ─────────────────────────────────────────────
-- 12. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id        CHAR(36)      REFERENCES users(id) ON DELETE SET NULL,
  action          VARCHAR(100)  NOT NULL,   -- 'application.status_changed'
  entity_type     VARCHAR(50),
  entity_id       CHAR(36),
  old_value       JSON,
  new_value       JSON,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor  (actor_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_ts     (created_at)
);

-- ─────────────────────────────────────────────
-- 13. RATE_LIMIT_BUCKETS (token bucket)
-- ─────────────────────────────────────────────
CREATE TABLE rate_limit_buckets (
  key_id          VARCHAR(200)  NOT NULL PRIMARY KEY,
  tokens          SMALLINT UNSIGNED NOT NULL,
  last_refill     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_refill (last_refill)
);

-- ─────────────────────────────────────────────
-- SEED: Default superadmin tenant + user
-- ─────────────────────────────────────────────
INSERT INTO tenants (id, name, domain, plan) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ShadowQuant Dynamics', 'shadowquant.io', 'enterprise');

-- password: Admin@123  (bcrypt hash, change in production)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'admin@shadowquant.io',
   '$2b$12$rMfHa0v2pIsPcPzBbkMJPO7Q5kLnj/0Nq9wFXRn.YuATgDsK3wJEy',
   'superadmin', 'Shadow', 'Admin', TRUE, TRUE);