ExamPro — Online Competitive Exam Mock Test Platform

ExamPro is a full-stack CBT (Computer Based Test) platform where an Admin can create exam papers with MCQ questions, and a Student can attempt them in a real, timed exam environment. Every question's response time, correctness, and accuracy is tracked automatically — the same data used in real competitive exam selection processes (SSC / Railway / Banking style mock tests).

✨ Features
🔐 JWT-based authentication with role-based access (ADMIN / STUDENT)
📝 Admin can create, edit, and publish exam papers with MCQ questions
⏱️ Real countdown timer with auto-submit when time runs out
📊 Per-question time tracking — exact seconds spent on every question, recorded automatically as the student navigates
✅ Negative marking support (real exam-style scoring)
📈 Detailed result analytics — score, accuracy %, correct/wrong/skipped count, time-per-question chart
🏆 Leaderboard / ranking per exam (score → time as tiebreaker)
🛠️ Tech Stack
Layer	Technology
Frontend	React.js (Vite), React Router, Axios, Recharts
Backend	Node.js, Express
Database	PostgreSQL
ORM	Prisma
Auth	JWT (JSON Web Token)

Why PostgreSQL? The data model is deeply relational — Exam → Question → Option → Attempt → Response — and the whole platform depends on aggregation queries (accuracy %, average time per question, ranking). A relational database handles this far more reliably than a document store like MongoDB.

📁 Project Structure
exam-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (6 models)
│   │   └── seed.js            # Demo data (admin, student, sample exam)
│   └── src/
│       ├── server.js
│       ├── config/             # Prisma client
│       ├── middleware/         # Auth guard, error handler
│       ├── controllers/        # Business logic
│       └── routes/             # API route definitions
│
└── frontend/
    └── src/
        ├── pages/               # Login, ExamList, TakeExam, Result, Admin*
        ├── components/          # Navbar, Timer, ProtectedRoute
        ├── context/             # Auth state
        └── api/                 # Axios instance
🗄️ Database Design
User (1) ──creates──> (many) Exam
Exam (1) ──has──> (many) Question
Question (1) ──has──> (many) Option
User (1) ──takes──> (many) Attempt
Attempt (1) ──has──> (many) Response
Question (1) ──has──> (many) Response

The Response table is the core of the analytics engine — one row per question per attempt, storing the selected option, correctness, and exact time spent. Every accuracy, timing, and ranking metric in the app is derived by aggregating this table.

🚀 Getting Started
Prerequisites
Node.js (v18+)
A PostgreSQL database (local install, or a free hosted instance via Neon / Supabase)
1. Clone the repository
bash
git clone https://github.com/<your-username>/exam-platform.git
cd exam-platform
2. Backend Setup
bash
cd backend
cp .env.example .env

Edit .env and set:

DATABASE_URL="postgresql://user:password@host:5432/exam_platform"
JWT_SECRET=your_long_random_secret

Then run:

bash
npm install
npx prisma migrate dev --name init
npm run seed        # optional: creates demo admin/student + sample exam
npm run dev          # starts backend on http://localhost:5000
3. Frontend Setup

Open a new terminal:

bash
cd frontend
cp .env.example .env
npm install
npm run dev          # starts frontend on http://localhost:5173
4. Login

Open http://localhost:5173 in your browser.

Role	Email	Password
Admin	admin@example.com	password123
Student	student@example.com	password123

(These credentials are created by npm run seed.)

⏱️ How Time-Tracking Works
When a student opens a question, the frontend records a start timestamp.
Every time they navigate to another question (Next / Previous / palette jump) or submit the exam, the frontend calculates elapsed seconds and sends it to the backend along with the selected answer.
The backend upserts a Response row per (attemptId, questionId) — if the student revisits a question, the time is added rather than overwritten.
On final submit, the backend aggregates all Response rows for that attempt to compute score, accuracy, and correct/wrong/skipped counts — all stored on the Attempt row for instant retrieval.
The result page renders the full per-question breakdown and a time-spent chart.
🔮 Future Scope
Proctoring support (tab-switch / fullscreen-exit detection)
Section-wise timers within a single exam
Mobile application
AI-based performance prediction and personalized practice suggestions
📄 License

This project is for educational/portfolio purposes.
