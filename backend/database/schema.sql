-- ==========================================
-- PARENT ENGAGEMENT SENTIMENT DASHBOARD
-- MySQL Database Schema Definition
-- Target: MySQL 8.x / MariaDB
-- ==========================================

/*
ENTITY-RELATIONSHIP DIAGRAM (TEXT REPRESENTATION):

  [users] 
     
  [parents] ───< [children] ───< [admissions]
     │              │
     │              └───┐
     ├───< [feedback] <─┘
     │         │
     │         └─── [sentiment_analysis]
     │
     ├───< [meetings]
     ├───< [communication_history]
     └───< [notifications]
*/

-- Create Database (Optional - uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS firstcry_intellitots_sentiment;
-- USE firstcry_intellitots_sentiment;

-- 1. Users Table (System Administrators and Teachers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contact_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Children Table
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    class_grade VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Admissions Table
CREATE TABLE IF NOT EXISTS admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    status ENUM('Enquired', 'Registered', 'Admitted', 'Withdrawn', 'At-Risk') DEFAULT 'Enquired',
    inquiry_date DATE,
    admission_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'academic', 'infrastructure', 'bus_safety', 'fees'
    message TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    meeting_date DATE NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    meeting_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Communication History Table
CREATE TABLE IF NOT EXISTS communication_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    type ENUM('email', 'portal_log', 'survey', 'rsvp', 'meeting_notes') NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sentiment Analysis Table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL UNIQUE,
    sentiment_score DECIMAL(5, 2) NOT NULL, -- Score from -1.00 to 1.00
    sentiment_label ENUM('Positive', 'Neutral', 'Negative') NOT NULL,
    extracted_keywords VARCHAR(255), -- Comma separated keywords
    recommendation TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    type ENUM('Notice', 'Appreciation', 'Reminder', 'Warning') NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Sent', 'Failed') DEFAULT 'Sent',
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for fast querying
CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_children_class ON children(class_grade);
CREATE INDEX idx_feedback_parent ON feedback(parent_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_sentiment_label ON sentiment_analysis(sentiment_label);
