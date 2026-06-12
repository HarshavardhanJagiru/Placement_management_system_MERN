# Campus Placement Management System (MERN Stack)

A comprehensive, role-based web application designed to streamline campus recruitment workflows, manage job postings, track candidate pipelines, and coordinate interview schedules. Built using the **MERN (MongoDB, Express.js, React, Node.js)** stack with a focus on modern UI design, robust security practices, and backend automation.

---

##  Key Features

###  Student Portal
*   **Interactive Kanban Board**: A drag-and-drop tracker (using HTML5 Drag and Drop API) that enables students to visually update their recruitment pipelines (e.g., Saved, Applied, Interview, Offered, Rejected) with optimistic UI updates and validation checks.
*   **Professional Profiles**: Profile management allowing students to list academic metrics (CGPA, Department), core skills, and upload resumes.
*   **Direct Job Search**: Search and filter options for active corporate openings matching criteria like minimum CGPA requirements.
*   **Notification Center**: Real-time alerts and in-app system notifications for schedule updates, offers, and deadlines.

###  Admin Portal (Placement Officer)
*   **Recruitment Pipeline Dashboard**: Manage and track all job postings, applications, and student statuses.
*   **Interactive Interview Calendar**: Complete calendar integration (powered by FullCalendar) displaying scheduled interviews.
*   **Analytics & Visual Metrics**: Integrated visual reports (powered by Chart.js) providing a snapshot of placement success, student registrations by department, and hiring companies.
*   **Batch Action Console**: Bulk email client permitting placement officers to filter candidates and broadcast announcements, schedule updates, or reminders.
*   **Data Export**: Built-in CSV reports generator for student registry data.

###  Automation & Authentication
*   **Background Reminder Daemon**: An active Node.js background process that polls the database to automatically trigger and send SMTP email alerts (via Nodemailer) to candidates with upcoming interviews scheduled within 24 hours.
*   **OTP Email Verification**: Multi-step registration flow verifying email addresses via One-Time Passwords (OTP).
*   **Role-Based Security**: API authorization enforced using JWT (JSON Web Tokens) and custom Express middlewares (`protect`, `adminOnly`, `studentOnly`).

---

##  Tech Stack

*   **Frontend**: React (Vite), CSS3, Lucide Icons, Axios, Chart.js, FullCalendar
*   **Backend**: Node.js, Express.js, Nodemailer
*   **Database**: MongoDB, Mongoose (ODM)
*   **Authentication**: JSON Web Tokens (JWT), BcryptJS (Password Hashing)

---

##  Project Structure

```text
├── backend/
│   ├── config/             # Database connection setups
│   ├── middlewares/        # JWT validation & role-authorization logic
│   ├── models/             # Mongoose schemas (User, Student, Job, Application, etc.)
│   ├── routes/             # RESTful API route definitions
│   ├── services/           # Background email daemon & Nodemailer utilities
│   ├── server.js            # Server entry point
│          
└── frontend/
    ├── src/
    │   ├── components/     # Reusable layout & UI components
    │   ├── context/        # React AuthContext for state preservation
    │   ├── pages/          # Layout views (Dashboards, Kanban, Auth pages)
    │   ├── services/       # Axios client setup with request/response interceptors
    │   ├── App.jsx         # Client-side router configuration
    │   └── main.jsx        # App mounting configuration
```

---

##  Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/placement_db
JWT_SECRET=your_jwt_secret_key_here
SMTP_EMAIL=your_gmail_address@gmail.com
SMTP_PASSWORD=your_gmail_app_password_here
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

##  Installation & Local Setup

### Prerequisites
*   Node.js (v16.x or higher)
*   MongoDB Local Community Server or MongoDB Atlas instance

### Step 1: Clone the Repository
```bash
git clone https://github.com/HarshavardhanJagiru/Placement_management_system_MERN.git
cd Placement_management_system_MERN
```

### Step 2: Set Up Backend
```bash
cd backend
npm install
# Populate your .env file
npm run seed  # Pre-populate MongoDB database with seed records
npm run dev   # Starts Nodemon development server on Port 5000
```

### Step 3: Set Up Frontend
```bash
# Open a new terminal instance
cd ../frontend
npm install
# Populate your .env file
npm run dev   # Starts Vite development server on Port 5173
```

---

##  Key Engineering Talking Points (For Interviews)
When discussing this project in SDE interviews, highlight these design patterns:
1.  **Optimistic State Updates**: Implemented on the Kanban board to shift cards immediately upon drag-and-drop, reverting them back smoothly only if the backend database transaction fails.
2.  **State Rollback & Exception Safety**: Handled in backend status modifications where locked applications (e.g., Offered/Rejected) block client changes and return appropriate HTTP status codes.
3.  **Background Processing & Daemon Design**: Decoupling the notification sender into an asynchronous server loop to run alongside the main Express process.
4.  **CORS & Interceptor Architecture**: Setting request headers globally using Axios interceptors to inject JWT bearer tokens on outgoing requests, with centralized 401 Unauthorized redirect handling.
