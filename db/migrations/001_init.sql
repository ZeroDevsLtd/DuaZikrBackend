-- Dua & Zikr v2 initial schema (MySQL 8 / MariaDB 10.6+)
-- Translations live in their own tables, so adding a language needs no schema change.
-- JSON-ish columns are TEXT holding JSON strings (portable across MySQL and MariaDB).

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT '',
  color VARCHAR(7) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category_translations (
  category_id INT NOT NULL,
  lang VARCHAR(5) NOT NULL,
  name VARCHAR(150) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  PRIMARY KEY (category_id, lang),
  CONSTRAINT fk_cat_tr_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE duas (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'hadith',
  category_id INT NULL,
  priority TINYINT NOT NULL DEFAULT 3,
  tags TEXT NOT NULL,
  arabic_text TEXT NOT NULL,
  reciter VARCHAR(100) NOT NULL DEFAULT '',
  audio_duration VARCHAR(10) NOT NULL DEFAULT '',
  audio_url VARCHAR(500) NOT NULL DEFAULT '',
  quran_surah INT NULL,
  quran_ayah INT NULL,
  quran_juz INT NULL,
  hadith_book VARCHAR(100) NOT NULL DEFAULT '',
  hadith_chapter VARCHAR(100) NOT NULL DEFAULT '',
  hadith_number VARCHAR(50) NOT NULL DEFAULT '',
  source VARCHAR(200) NOT NULL DEFAULT '',
  authenticity VARCHAR(30) NOT NULL DEFAULT '',
  when_to_recite TEXT NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'beginner',
  estimated_time VARCHAR(10) NOT NULL DEFAULT '00:00:30',
  related_duas TEXT NOT NULL,
  notes TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  reviewed_by VARCHAR(100) NOT NULL DEFAULT '',
  reviewed_at DATETIME(3) NULL,
  view_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  last_read DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_duas_category (category_id),
  KEY idx_duas_status (status),
  KEY idx_duas_type (type),
  CONSTRAINT fk_duas_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dua_translations (
  dua_id VARCHAR(50) NOT NULL,
  lang VARCHAR(5) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  transliteration TEXT NOT NULL,
  translation TEXT NOT NULL,
  explanation TEXT NOT NULL,
  benefits TEXT NOT NULL,
  PRIMARY KEY (dua_id, lang),
  CONSTRAINT fk_dua_tr_dua FOREIGN KEY (dua_id) REFERENCES duas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ads (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  text TEXT NOT NULL,
  action_text VARCHAR(100) NOT NULL,
  action_color VARCHAR(7) NOT NULL DEFAULT '#2c5530',
  text_color VARCHAR(7) NOT NULL DEFAULT '#495057',
  title_color VARCHAR(7) NOT NULL DEFAULT '#2c5530',
  link VARCHAR(500) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  icon_color VARCHAR(7) NOT NULL DEFAULT '#2c5530',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  age INT NULL,
  gender CHAR(1) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Only a SHA-256 hash of each token is stored; the raw token is shown to the client once.
CREATE TABLE auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_used_at DATETIME(3) NULL,
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT '',
  app_version VARCHAR(30) NULL,
  package_name VARCHAR(150) NULL,
  locale VARCHAR(35) NULL,
  user_id INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_devices_token (device_token),
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No FK to duas: the app may hold ids of bundled local duas too.
CREATE TABLE favorites (
  user_id INT NOT NULL,
  dua_id VARCHAR(50) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, dua_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
