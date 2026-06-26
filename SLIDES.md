# 12-Slide Pitch Deck: Parent Engagement Sentiment Dashboard
## FirstCry Intellitots Sentiment Console

---

### Slide 1: Title Slide
* **Title:** Parent Engagement Sentiment Dashboard
* **Subtitle:** Data-Driven Retention & Sentiment Engine for Preschools
* **Presented by:** Principal Full-Stack Engineer & Architect
* **Target Brand:** FirstCry Intellitots
* **Speaker Notes:** Welcome everyone. Today we are presenting the Parent Engagement Sentiment Dashboard, a platform designed to map parent satisfaction, proactively identify withdrawal risks, and automate school-parent interaction workflows.

---

### Slide 2: Project Objective
* **Heading:** Why Parent Sentiment Matters
* **Bullet Points:**
  - **Early Warning:** Track parental concerns before they escalate to school admission withdrawals.
  - **Qualitative Ingestion:** Aggregate feedback from emails, survey forms, and portal notes.
  - **Quantitative Metrics:** Convert written complaints into numeric satisfaction metrics.
  - **Target Actions:** Give Center Heads immediate recommendations to address grievances.
* **Speaker Notes:** Our goal is to prevent student churn. By collecting feedback early, we can act immediately on grievances regarding transport, academics, or facilities.

---

### Slide 3: Operational Pain Points
* **Heading:** Identifying Key Areas of Friction
* **Bullet Points:**
  - **Fragmented Channels:** Parent complaints are scattered across emails, diaries, and verbal chats.
  - **No Central Tracking:** Admins lack aggregated trend metrics for specific classes or branches.
  - **Transport & Safety Risks:** Safety concerns (e.g., bus speeding) require immediate routing.
  - **Academic Stress:** Homework load issues in preschool classes need quick adjustments.
* **Speaker Notes:** Currently, center heads only know a parent is unhappy when they withdraw. Our dashboard changes that by highlighting concerns like bus safety and homework load in real time.

---

### Slide 4: Technology Stack
* **Heading:** Modern, Scalable Full-Stack Javascript
* **Bullet Points:**
  - **Frontend:** React.js + Tailwind CSS for a premium glassmorphic UI.
  - **Data Visualization:** Recharts for gradient-area sentiment trends and monthly indices.
  - **Backend API:** Node.js + Express.js service layer.
  - **Data Layer:** MongoDB for unstructured reviews + MySQL relational SQL schemas.
  - **NLP Service:** Dictionary/lexicon-based processor for sentiment scoring & PII masking.
* **Speaker Notes:** We selected React and Tailwind for a premium dashboard design. Mongoose provides schema flexibility, while Express handles API routing efficiently.

---

### Slide 5: The Analytics Ingestion Pipeline
* **Heading:** 5-Phase Feedback Processing
* **Bullet Points:**
  - **Phase 1: Ingestion:** Capture data from emails, portal logs, and surveys.
  - **Phase 2: Normalization:** Standardize text formatting and mask PII (emails/phone numbers).
  - **Phase 3: Sentiment & Keywords:** Run NLP dictionary checks to assign score (-1 to 1) and topic tags.
  - **Phase 4: Engagement Indexing:** Compute weighted engagement index (0-100) based on portal activity.
  - **Phase 5: Visual Dashboard:** Present alerts, timeline feeds, and export files.
* **Speaker Notes:** Data goes through cleaning, masking, sentiment scoring, keyword extraction, and index calculation before appearing on the administrator's dashboard.

---

### Slide 6: Relational MySQL Database Schemas
* **Heading:** Corporate Data Structures
* **Bullet Points:**
  - **Primary Profiles:** `parents`, `children`, and `users` tables.
  - **Operational Entries:** `feedback`, `meetings`, and `communication_history` tables.
  - **Pipeline Analytics:** `sentiment_analysis` table storing scores, keywords, and recommendations.
  - **Referential Integrity:** Enforces Primary Keys, Cascading Foreign Keys, and query indexing.
* **Speaker Notes:** While we run Mongoose models on the backend, we also created a complete SQL script representing the corporate schema with appropriate relations and foreign keys.

---

### Slide 7: Backend NLP & Scoring Formula
* **Heading:** Computing Sentiment and Engagement
* **Bullet Points:**
  - **Sentiment Index:** Score (-1 to 1) determined by positive vs. negative word counts.
  - **PII Masking:** Regex patterns replace personal emails and phone numbers with generic labels.
  - **Engagement Score (0-100):** Calculates participation across portal features.
  - **Weighted Index Logic:**
    * Portal Logins: 5 pts each (Max 30)
    * Survey Completion: 35 pts
    * Event RSVP/Attendance: 35 pts
* **Speaker Notes:** The NLP sandbox uses local lexicon logic, making it fast and dependency-free. The engagement score uses a weighted formula to identify parents who are losing touch.

---

### Slide 8: Interactive Sentiment Sandbox
* **Heading:** Testing Content On-The-Fly
* **Bullet Points:**
  - **Playground Panel:** Admins can paste email text or letters to evaluate scores.
  - **Immediate Validation:** Preview normalized text and masked PII outputs.
  - **Keyword Extraction:** Identify categories (e.g. *Bus safety*, *Homework load*) instantly.
  - **Proactive Recommendations:** Suggests immediate center operations follow-up tasks.
* **Speaker Notes:** The sandbox page allows admins to test arbitrary communications instantly. The engine returns recommendations (e.g. "Alert transport team") without altering database state.

---

### Slide 9: Administrative Dashboard Overview
* **Heading:** Beautiful Dark Slate Minimini Theme
* **Bullet Points:**
  - **Stat Cards:** At-a-glance average sentiment, engagement levels, alerts, and meetings.
  - **Time-Series Chart:** Visualized monthly fluctuations using gradient area plots.
  - **Top Concerns:** Bar chart highlighting the most frequent keyword occurrences.
  - **Recent Activities:** Unified history feed detailing recent feedback submissions and PTMs.
* **Speaker Notes:** This dashboard design is inspired by the modern Minimini aesthetic, featuring glowing cards, clear indicators, and interactive areas.

---

### Slide 10: Parent Meeting Scheduler
* **Heading:** Coordinating Teacher-Parent Interventions
* **Bullet Points:**
  - **Scheduling Portal:** Register meetings directly, linking parent profiles.
  - **Status Updates:** Mark events as Scheduled, Completed, Cancelled, or No-Show.
  - **Outcome Records:** Save detailed teacher summary notes directly inside completed entries.
  - **Auto Reminder Notices:** One-click reminder button with automated template dispatch.
* **Speaker Notes:** Center heads can schedule PTMs directly. Once completed, they can log resolution notes to track parent-school alignment.

---

### Slide 11: Notice Generator & Communication Templates
* **Heading:** Automating Standard Communications
* **Bullet Points:**
  - **Four Prebuilt Templates:**
    * PTM Invitation Notice
    * Parent Appreciation Message
    * Warning & Care-call Request
    * Weekly Portal Activity Reminder
  - **Context-Aware Parameters:** Auto-populates child name, date, and extracted keywords.
  - **Administrative Utility:** One-click clipboard copying.
* **Speaker Notes:** The notice generator saves teachers time by auto-compiling customized emails, allowing them to send alerts or thank-you notes with one click.

---

### Slide 12: Reports & Future Roadmap
* **Heading:** Export Options & Scalability
* **Bullet Points:**
  - **Reporting Formats:** Screen lists, print-friendly reports, and raw CSV exports.
  - **CSV Integration:** Download entire history files with parent details, scores, and ratings.
  - **AI Expansion Plan:** Plug in Gemini/OpenAI API keys for advanced semantic context.
  - **Multi-Center Syncing:** Scale schemas to aggregate metrics across multiple preschool branches.
* **Speaker Notes:** Administrators can export spreadsheets for deeper analytics. In the future, this system can scale to track multiple branches under a unified parent dashboard.
