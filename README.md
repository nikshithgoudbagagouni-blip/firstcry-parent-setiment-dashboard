# FirstCry Intellitots - Parent Engagement Sentiment Dashboard

A comprehensive full-stack administrative platform engineered to collect parent feedback, run NLP sentiment scoring, compute parent engagement indexes, flag at-risk registrations, and coordinate proactive interventions (notices, meetings, CSV/PDF analytics export).

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Optional - Fallback database mode utilizes localized JSON file storage)

### 1. Set Up Backend Services
```bash
cd backend
npm install
```
Configure environment variables in a `.env` file (e.g. `PORT=5000`, `MONGO_URI`). To seed initial mock parent records:
```bash
npm run seed
```
Start the service:
```bash
npm start
```
The Express service will run on [http://localhost:5000](http://localhost:5000). Verify status at `/api/status`.

### 2. Set Up Dashboard Frontend
```bash
cd frontend
npm install
npm run dev
```
The React development server will start on [http://localhost:5173](http://localhost:5173).

---

## 📁 Repository Directory Structure

```
fristcry/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & quick fallbacks
│   ├── controllers/
│   │   ├── analyticsController.js # Grouping and timeseries trend logic
│   │   ├── feedbackController.js  # Sentiment & ingestion CRUD
│   │   ├── meetingController.js   # PTM coordination
│   │   ├── dashboardController.js # Metric aggregators
│   │   └── reportController.js    # Data compiling & CSV formatting
│   ├── models/
│   │   ├── Parent.js             # Mongoose schemas
│   │   ├── Interaction.js
│   │   ├── AnalyticsCache.js
│   │   ├── Meeting.js
│   │   └── User.js
│   ├── routes/
│   │   ├── feedback.js           # REST routers
│   │   ├── meeting.js
│   │   ├── analytics.js
│   │   ├── dashboard.js
│   │   ├── report.js
│   │   └── notice.js
│   ├── services/
│   │   ├── sentimentService.js   # Lexicon NLP engine & engagement calculators
│   │   └── noticeService.js      # Custom email templates builder
│   ├── database/
│   │   ├── schema.sql            # MySQL DDL schemas & relationship tables
│   │   └── seedData.js           # Data seed ingestion utility
│   ├── server.js                 # Entry bootstrapper
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Side console router
│   │   │   └── StatCard.jsx      # Metrics visualizer cards
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Administrative login
│   │   │   ├── Dashboard.jsx     # Main stats & charting panels
│   │   │   ├── FeedbackForm.jsx  # Manual ingestion portal
│   │   │   ├── MeetingScheduler.jsx # PTM schedules
│   │   │   ├── SentimentAnalysis.jsx # NLP Sandbox testing
│   │   │   ├── CommunicationHistory.jsx # Historical audit timeline
│   │   │   ├── NoticeGenerator.jsx # Notice formatting templates
│   │   │   └── Reports.jsx       # Filtering & export controllers
│   │   ├── App.jsx               # Entry state router
│   │   ├── main.jsx
│   │   └── index.css             # Glassmorphic Tailwind stylesheets
│   ├── tailwind.config.js
│   └── package.json
├── README.md                     # Overview & Quickstart instructions
├── PROJECT_REPORT.md             # Detailed engineering specifications & ERDs
└── SLIDES.md                     # 12-Slide corporate PPT slide-deck
```

---

## 🏛️ Comprehensive Architecture & Design Documents

For in-depth explanations, diagrams, schemas, and presentations:
1. Refer to [PROJECT_REPORT.md](file:///c:/Users/NIKSHITH%20GOUD/OneDrive/Desktop/fristcry/PROJECT_REPORT.md) for the complete engineering report, ER diagrams, data ingestion flows, and backend pipeline blueprints.
2. Refer to [SLIDES.md](file:///c:/Users/NIKSHITH%20GOUD/OneDrive/Desktop/fristcry/SLIDES.md) for the 12-slide Pitch Deck outlining the project objectives, architecture, metrics, and business value.
