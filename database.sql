-- ==========================================================
-- BlogHub Database Schema & Sample Data
-- Web Technologies Course Project
-- Database: MySQL
-- ==========================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS bloghub;
USE bloghub;

-- 2. Drop existing tables if re-running script (in order of foreign key dependencies)
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 3. Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Posts Table
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create Comments Table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create Likes Table
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_post_like (user_id, post_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Insert Default Data
-- ==========================================================

-- Default Categories
INSERT INTO categories (id, name) VALUES
(1, 'Technology'),
(2, 'Programming'),
(3, 'Web Development'),
(4, 'Education'),
(5, 'Artificial Intelligence'),
(6, 'Other');

-- Sample Users (Password for all sample users is: 'password123')
-- Bcrypt hash for 'password123': $2a$10$7Z8VqY15Gk7Z7hFwXl/eOu2gS96eXJjN8rPz7q0M6m8o2j9tA.eum
INSERT INTO users (id, name, email, password, bio, created_at) VALUES
(1, 'Alex Johnson', 'alex@bloghub.com', '$2a$10$7Z8VqY15Gk7Z7hFwXl/eOu2gS96eXJjN8rPz7q0M6m8o2j9tA.eum', 'Senior Web Developer and computer science educator. Passionate about JavaScript and open-source software.', NOW()),
(2, 'Sarah Williams', 'sarah@bloghub.com', '$2a$10$7Z8VqY15Gk7Z7hFwXl/eOu2gS96eXJjN8rPz7q0M6m8o2j9tA.eum', 'AI researcher and tech enthusiast writing about the future of neural architectures and machine learning.', NOW()),
(3, 'David Miller', 'david@bloghub.com', '$2a$10$7Z8VqY15Gk7Z7hFwXl/eOu2gS96eXJjN8rPz7q0M6m8o2j9tA.eum', 'Computer Science student and full-stack tinkerer building clean web experiences.', NOW());

-- Sample Blog Posts
INSERT INTO posts (id, title, content, user_id, category_id, created_at, updated_at) VALUES
(1, 'Getting Started with Full-Stack Web Development in 2026', 'Full-stack web development continues to evolve at a breakneck pace. From understanding the core triad of HTML, CSS, and JavaScript to managing robust backend APIs with Node.js and Express, mastering the fundamentals remains the most enduring skill in software engineering.\n\nIn this article, we explore the essential pillars every student should focus on: semantic document structure, scalable relational database modeling with MySQL, secure session handling, and clean RESTful endpoint design. When you understand the underlying HTTP cycle, frameworks become tools rather than crutches.', 1, 3, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),

(2, 'Demystifying Relational Database Design and Normalization', 'Why does database normalization matter? In modern web engineering, data integrity is paramount. By segregating entities into distinct tables such as users, categories, posts, and comments, we eliminate data redundancy and prevent anomalous updates.\n\nForeign keys coupled with CASCADE constraints ensure that orphan records do not linger when a parent entity is deleted. Understanding how to construct indexes on foreign keys and unique constraints will dramatically improve query execution times when your dataset grows to millions of rows.', 1, 2, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),

(3, 'The Rise of Practical Artificial Intelligence in Daily Workflows', 'Artificial Intelligence has transitioned from academic theoretical models to ubiquitously deployed everyday tooling. Today, developers integrate language models and predictive algorithms to streamline repetitive coding workflows, analyze complex datasets, and automate quality assurance.\n\nHowever, understanding classical computing fundamentals—algorithms, data structures, and deterministic logic—is more vital than ever to audit and deploy AI models safely and effectively.', 2, 5, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),

(4, 'Effective Study Techniques for Computer Science Exams and Vivas', 'Preparing for a technical university viva requires a different mindset than writing code in an IDE. Examiners seek to evaluate your foundational conceptual clarity: Can you explain how the client sends an HTTP request? What happens under the hood during password hashing? Why do we use prepared statements instead of string concatenation?\n\nPractice sketching your database schema on paper and walking through the request-response cycle out loud. Being able to explain your design choices clearly is a hallmark of a great developer.', 3, 4, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),

(5, 'Writing Clean, Maintainable Vanilla JavaScript in Modern Browsers', 'While frontend build tools and bundlers have their place, modern ECMAScript has made vanilla JavaScript remarkably expressive and capable. With the native Fetch API, async/await syntax, DOM query selectors, and event delegation, building dynamic, interactive user interfaces without heavy dependencies is both refreshing and performant.\n\nIn this tutorial, we review key patterns for building interactive components, managing form submissions without full-page reloads, and handling asynchronous errors with grace.', 1, 2, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

(6, 'The Importance of Cybersecurity and Session Hygiene in Web Apps', 'Security cannot be an afterthought in web application design. Plaintext passwords must never touch your database; utilizing cryptographic hashing functions like bcrypt with salt factors ensures credentials remain protected even in the event of an unauthorized data dump.\n\nAdditionally, implementing proper authorization checks on every mutating route prevents unauthorized users from altering records they do not own.', 2, 1, NOW(), NOW()),

(7, 'Exploring Cloud Computing and Distributed Systems', 'Distributed systems allow applications to scale horizontally across global regions. Understanding stateless application architecture, load balancers, and persistent database clustering prepares students for enterprise-grade software architecture.', 3, 1, NOW(), NOW());

-- Sample Comments
INSERT INTO comments (id, post_id, user_id, comment, created_at) VALUES
(1, 1, 2, 'Fantastic overview! The emphasis on understanding HTTP and REST is spot on for web tech students.', NOW() - INTERVAL 4 DAY),
(2, 1, 3, 'This helped me understand the client-server interaction clearly. Thanks for sharing!', NOW() - INTERVAL 3 DAY),
(3, 2, 2, 'Normalization and foreign key cascade rules saved me hours of debugging in my project.', NOW() - INTERVAL 3 DAY),
(4, 3, 1, 'Well articulated perspective on AI and foundational CS principles.', NOW() - INTERVAL 2 DAY),
(5, 5, 3, 'Vanilla JS with fetch API is so clean when you know how to use it properly!', NOW() - INTERVAL 1 DAY);

-- Sample Likes
INSERT INTO likes (id, post_id, user_id, created_at) VALUES
(1, 1, 2, NOW()),
(2, 1, 3, NOW()),
(3, 2, 1, NOW()),
(4, 2, 3, NOW()),
(5, 3, 1, NOW()),
(6, 3, 3, NOW()),
(7, 4, 1, NOW()),
(8, 4, 2, NOW()),
(9, 5, 2, NOW()),
(10, 6, 1, NOW());
