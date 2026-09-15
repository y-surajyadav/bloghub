# BlogHub - Full Stack Blog Application

**Course:** Web Technologies End-Semester Project  
**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, EJS, REST API, MySQL

---

## 1. Project Description

**BlogHub** is a clean, modern, fully functional full-stack blog web application built for a university **Web Technologies** course. It provides a complete end-to-end publishing platform with user authentication, CRUD operations for blog posts, real-time social interactions (likes and comments), categorized browsing, full-text database searching, server-side pagination, and an interactive user author dashboard.

The application follows the classic Model-View-Controller (MVC) architectural pattern, keeping concerns strictly separated:
- **Views:** Server-side rendered HTML using EJS templates and plain CSS.
- **Controllers & Routing:** Express.js REST APIs and page route handlers.
- **Data Layer:** MySQL relational database accessed via prepared SQL statements using the `mysql2` driver with foreign key constraints.

---

## 2. Features

### Authentication & Authorization
* **Session-Based Authentication:** Uses `express-session` with secure HTTP cookies (no JWT).
* **Password Security:** Cryptographic password hashing using `bcrypt`.
* **Input Validation:** Email syntax verification, password length, and duplicate email prevention.
* **Server-Side Authorization:** Strict route authorization — users can only edit/delete their own posts and comments (HTTP 403 Forbidden enforcement).

### Blog Posts Management (CRUD)
* **View All Posts:** Displays posts in a responsive card grid with title, excerpt, author, date, category badge, and interaction stats.
* **Individual Post Page:** Full article reading view with formatted paragraphs and author metadata.
* **Create Post:** Category selection, validation, and instantaneous redirect.
* **Edit Post:** Form pre-filled with post data, restricted strictly to the post creator.
* **Delete Post:** Client-side JavaScript confirmation prompt with cascading database removal of associated comments and likes.

### Search, Filter, and Pagination
* **Database Full-Text Search:** Uses SQL `LIKE` with parameterized queries on both `title` and `content`.
* **Category Filtering:** Filter posts by categories (`Technology`, `Programming`, `Web Development`, `Education`, `Artificial Intelligence`, `Other`).
* **Server-Side Pagination:** Efficient pagination utilizing MySQL `LIMIT` and `OFFSET` (6 articles per page).

### Social Interaction
* **Like / Unlike System:** Interactive toggle using Fetch API and asynchronous DOM updates. Database-level `UNIQUE(user_id, post_id)` prevents multiple likes.
* **Comment System:** Logged-in users can post comments. Authors can delete their own comments.

### User Dashboard & Profile
* **Dashboard Overview:** Displays aggregated author metrics: Total Posts, Total Likes Received, and Total Comments Received.
* **Manage My Posts:** Centralized table of author articles with one-click View, Edit, and Delete actions.
* **Public Profile:** Shows author bio, registration date, stats, and catalog of published articles.
* **Edit Profile:** Update author name and biography with live preview.

---

## 3. Technologies Used

* **Frontend:** HTML5, Plain CSS3 (No Bootstrap, No Tailwind), Vanilla JavaScript (Fetch API, DOM manipulation)
* **Backend:** Node.js, Express.js, EJS (Embedded JavaScript Templates)
* **Database:** MySQL (via `mysql2` connection pool)
* **Authentication:** `express-session`, `bcryptjs`
* **Configuration:** `dotenv`

---

## 4. Project Structure

```text
bloghub/
│
├── config/
│   └── db.js                 # Reusable MySQL connection pool & fallback engine
│
├── controllers/
│   ├── authController.js     # Register, login, and logout logic
│   ├── postController.js     # Posts CRUD, search, filter, likes
│   ├── commentController.js  # Add and delete comments
│   └── userController.js     # User profile and dashboard statistics
│
├── middleware/
│   └── authMiddleware.js     # Route protection & authorization guards
│
├── public/
│   ├── css/
│   │   └── style.css         # Pure CSS styling (variables, cards, navbar, grid)
│   └── js/
│       ├── main.js           # Navbar toggle, category tabs, logout
│       ├── login.js          # Client-side login submission & demo logins
│       ├── register.js       # Client-side registration form validation
│       ├── post.js           # Likes, comments, delete post handler
│       ├── create-post.js    # Create post validation & fetch handler
│       └── edit-post.js      # Edit post validation & fetch handler
│
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── postRoutes.js         # /api/posts endpoints
│   ├── commentRoutes.js      # /api/comments endpoints
│   └── userRoutes.js         # /api/users endpoints
│
├── views/
│   ├── partials/
│   │   ├── header.ejs        # Shared HTML head and stylesheet links
│   │   ├── navbar.ejs        # Responsive navigation bar
│   │   └── footer.ejs        # Shared footer with course metadata
│   ├── index.ejs             # Homepage with search, filter, and pagination
│   ├── login.ejs             # Login page with demo accounts
│   ├── register.ejs          # Registration page
│   ├── post.ejs              # Single post view with comments and likes
│   ├── create-post.ejs       # Post creation form
│   ├── edit-post.ejs         # Post editing form
│   ├── dashboard.ejs         # User dashboard with stats & post management
│   ├── profile.ejs           # Public author profile
│   ├── edit-profile.ejs      # Profile editor
│   └── 404.ejs               # Clean 404 error page
│
├── .env.example              # Environment variables template
├── database.sql              # Complete MySQL schema and seed data
├── package.json              # Node.js project manifest and scripts
├── server.js                 # Express application entry point
└── README.md                 # Project documentation
```

---

## 5. Database Setup (MySQL)

1. Open your MySQL client (MySQL Command Line Client, MySQL Workbench, XAMPP phpMyAdmin, or terminal).
2. Execute the provided `database.sql` script:
   ```bash
   mysql -u root -p < database.sql
   ```
   Or open `database.sql` in MySQL Workbench / phpMyAdmin and run all queries.
3. This creates the `bloghub` database and the tables: `users`, `categories`, `posts`, `comments`, `likes`.
4. It also populates default categories and sample blog posts with test users.

---

## 6. Installation & Configuration

1. **Clone or download the project** and open the terminal in the project directory.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=bloghub
   DB_PORT=3306
   PORT=3000
   SESSION_SECRET=bloghub_super_secret_session_key_2026
   ```

---

## 7. Running the Application

Start the Express server:

```bash
npm start
```
Or for development:
```bash
npm run dev
```
Or run directly with Node:
```bash
node server.js
```

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 8. Test Accounts for Viva Demonstration

The database includes 3 pre-seeded test accounts. You can click on the quick-login buttons on the `/login` page or use the credentials:

| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** | `alex@bloghub.com` | `password123` | Author / Educator |
| **Sarah Williams** | `sarah@bloghub.com` | `password123` | AI Researcher |
| **David Miller** | `david@bloghub.com` | `password123` | Student Developer |

---

## 9. REST API Reference

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user & start session | No |
| `POST` | `/api/auth/logout` | Destroy active session | Yes |
| `GET` | `/api/posts` | Get posts (search, filter, pagination) | No |
| `GET` | `/api/posts/:id` | Get single post with likes & comments | No |
| `POST` | `/api/posts` | Create new post | Yes |
| `PUT` | `/api/posts/:id` | Update existing post (owner only) | Yes |
| `DELETE` | `/api/posts/:id` | Delete post (owner only) | Yes |
| `POST` | `/api/posts/:id/like` | Like a post | Yes |
| `DELETE` | `/api/posts/:id/like` | Unlike a post | Yes |
| `GET` | `/api/posts/:id/comments` | Get comments for a post | No |
| `POST` | `/api/posts/:id/comments` | Add a comment to a post | Yes |
| `DELETE` | `/api/comments/:id` | Delete comment (owner only) | Yes |
| `GET` | `/api/users/:id` | Get user profile & author stats | No |
| `PUT` | `/api/users/:id` | Update profile bio and name | Yes |
| `GET` | `/api/categories` | List all blog categories | No |
