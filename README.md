# CivicDesk: Online Grievance Redressal Portal

A full-stack grievance workflow built with React/Vite, Express, MongoDB/Mongoose, JWT, bcrypt, Multer, Nodemailer, node-cron, and Recharts.

## Requirements

- Node.js 18+
- MongoDB running locally, or a MongoDB connection string

## Setup

### Backend

```powershell
cd backend
Copy-Item .env.example .env
# Update MONGO_URI and JWT_SECRET in .env
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000`.

The seed creates sample departments/categories and this admin account:

- Email: `admin@civicdesk.local`
- Password: `Admin123!`

Create officer accounts by registering users and changing their role/department from the admin user management API. Mail is console-logged through a stream transporter during development.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The client runs at `http://localhost:5173`. Set `VITE_API_URL` when the API is hosted elsewhere, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

## Included API areas

- JWT registration, login, and current-user lookup
- Citizen grievance creation, local attachments, history, comments, and resolved feedback
- Officer department queues and lifecycle status updates
- Admin assignment, analytics aggregations, departments, categories, users, and CSV export
- Daily unresolved-after-seven-days escalation job
- Console-safe development email notifications on status changes

## Project layout

- `backend/models`: Mongoose schemas
- `backend/routes`: auth, grievance, and admin APIs
- `backend/middleware`: JWT and role protection
- `backend/jobs`: scheduled escalation
- `frontend/src/App.jsx`: routed role-based application shell
- `frontend/src/index.css`: responsive visual system
