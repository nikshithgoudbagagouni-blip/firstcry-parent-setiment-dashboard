# Project Engineering Report: Parent Sentiment & Engagement Console

## 1. System Objective
For early childhood centers like **FirstCry Intellitots**, identifying parental sentiment trends is crucial to maintaining enrollment retention. The **Parent Engagement Sentiment Dashboard** serves as a proactive warning mechanism for teachers and Center Heads. It aggregates comments from demo visits, surveys, email boxes, and portal records; processes them through a custom NLP classifier; computes a weighted parent engagement metric; and generates alerts for parents showing declining satisfaction rates before they withdraw enrollment.

---

## 2. Ingestion & Analytics Pipeline Flow

```
[PHASE 1: DATA INGESTION & PIPELINE]
       │
       ▼
 ┌───────────┐      ┌───────────────┐      ┌─────────────────┐
 │   Email   │      │ Survey Form   │      │ School Portal   │
 │ Ingestion │      │  Submissions  │      │ Activity Logs   │
 └─────┬─────┘      └───────┬───────┘      └────────┬────────┘
       │                    │                       │
       └──────────────┬─────┴───────────────────────┘
                      ▼
 ┌──────────────────────────────────────────────────┐
 │               Data Normalization                 │
 │  (Clean text, standardize formats, mask PII)     │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
[PHASE 2: PROCESSING & ANALYTICS ENGINE]
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │             NLP Sentiment Analyzer               │
 │ (Classify text: Positive, Neutral, Negative)     │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │         Engagement Scoring Calculation           │
 │ (Aggregate actions, login frequency, RSVP rates) │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │            Keyword / Topic Modeler               │
 │     (Extract core themes & pain points)          │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
[PHASE 3: STORAGE & DATABASE]
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │            MongoDB / Data Warehouse              │
 │  (Store User, Feedback, and Timeseries Scores)   │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
[PHASE 4: BACKEND API LAYER]
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │            Node.js / Express API                 │
 │ (Endpoints for Trend Analysis, Top Alerts, Auth)  │
 └────────────────────┬─────────────────────────────┘
                      │
                      ▼
[PHASE 5: FRONTEND DASHBOARD UI]
                      │
                      ▼
 ┌──────────────────────────────────────────────────┐
 │           React.js Admin Dashboard               │
 │  (Charts, Sentiment Trends, & Alert Badges)     │
 └──────────────────────────────────────────────────┘
```

### Ingestion Details
- **Phase 1: Ingestion & Normalization**: Standardizes raw text by stripping trailing whitespaces, symbols, and transforming characters to lowercase. A regex filter scans text to mask PII, substituting emails with `[EMAIL_MASKED]` and phone numbers with `[PHONE_MASKED]`.
- **Phase 2: NLP Scoring & Engagement**: Evaluates text against a lexicon to calculate a satisfaction score from -1.0 (very negative) to +1.0 (very positive). Computes an **Engagement Index (0-100)** based on weighted parameters:
  $$\text{Engagement Index} = \text{Min}\left(100, (\text{logins} \times 5) + (\text{surveyCompleted} ? 35 : 0) + (\text{eventAttended} ? 35 : 0)\right)$$
- **Phase 3: Topic Modeling**: Matches string keywords to tag issues in preschool administrative workflows (e.g. *Bus safety*, *Homework load*, *Food quality*, *Fees & pricing*).

---

## 3. Relational Database Design & Relationships (MySQL)

### Entity-Relationship Diagram (ERD)
```
 +------------------+           +------------------+
 |      parents     |           |      users       |
 +------------------+           +------------------+
 | PK | id          |           | PK | id          |
 |    | name        |           |    | name        |
 |    | email       |           |    | email       |
 |    | contact_no  |           |    | password    |
 |    | created_at  |           |    | role        |
 +---------┬--------+           +------------------+
           │
           ├──────────────────────────────┐
           ▼ 1:N                          ▼ 1:N
 +------------------+           +----------------------+
 |     children     |           | meetings             |
 +------------------+           +----------------------+
 | PK | id          |           | PK | id              |
 | FK | parent_id   |──────────>| FK | parent_id       |
 |    | name        |           |    | title           |
 |    | dob         |           |    | description     |
 |    | class_grade |           |    | meeting_date    |
 +---------┬--------+           |    | status          |
           │                    |    | reminder_sent   |
           ▼ 1:1                +----------------------+
 +------------------+                     │
 |    admissions    |                     ▼ 1:N
 +------------------+           +----------------------+
 | PK | id          |           | notifications        |
 | FK | child_id    |           +----------------------+
 |    | status      |           | PK | id              |
 |    | inquiry_dt  |           | FK | parent_id       |
 |    | admission_dt|           |    | type            |
 +---------┬--------+           |    | message         |
           │                    |    | sent_at         |
           │                    +----------------------+
           ▼ 1:N
 +------------------+           +----------------------+
 |     feedback     |           | communication_history|
 +------------------+           +----------------------+
 | PK | id          |           | PK | id              |
 | FK | parent_id   |           | FK | parent_id       |
 | FK | child_id    |           |    | type            |
 |    | category    |           |    | content         |
 |    | message     |           |    | timestamp       |
 |    | rating      |           +----------------------+
 |    | submission  |
 +---------┬--------+
           │
           ▼ 1:1
 +-----------------------+
 |  sentiment_analysis   |
 +-----------------------+
 | PK | id               |
 | FK | feedback_id      |
 |    | sentiment_score  |
 |    | sentiment_label  |
 |    | keywords         |
 |    | recommendation   |
 +-----------------------+
```

### Table Relationships & Keys
1. **parents (PK: id)**: Stores profile entries. Matches 1:N to `children` via `children.parent_id`.
2. **children (PK: id, FK: parent_id)**: Linked to `parents`. Maps 1:1 to `admissions` tracking status updates.
3. **feedback (PK: id, FKs: parent_id, child_id)**: Linked to both parent and child profiles.
4. **sentiment_analysis (PK: id, FK: feedback_id UNIQUE)**: Contains NLP engine evaluation outputs linked to specific feedback comments.
5. **meetings (PK: id, FK: parent_id)**: Links to parents to organize calendar entries.
6. **communication_history (PK: id, FK: parent_id)**: Timestamps all raw channel interactions (surveys, portal logins, text comments).

---

## 4. API Documentation

- **POST `/api/feedback/create`**:
  *Payload:*
  ```json
  {
    "parentName": "Rahul Sharma",
    "childName": "Aarav Sharma",
    "email": "rahul@example.com",
    "message": "Class teacher is excellent, but homework load is high.",
    "rating": 4,
    "portalLogins": 12,
    "surveyCompleted": true,
    "eventAttended": false
  }
  ```
  *Response:* `250 OK` containing created parent document, interaction reference ID, NLP labels, and computed engagement points.

- **GET `/api/feedback/list`**:
  Returns all feedback records combined with parent profiles, ordered by timestamp.

- **POST `/api/sentiment/process`**:
  Evaluates raw text, returns sentiment score/label, PII masked string, and center recommendations without writing to database.

- **GET `/api/dashboard`**:
  Aggregates counts (total, positive, neutral, negative), compiles list of active PTM meetings, and outputs list of at-risk parents.

- **GET `/api/analytics/trends`**:
  Timeseries metrics mapping dates to average sentiment and engagement. Used for rendering charts.

- **GET `/api/report`**:
  Compiles CSV downloads (`format=csv`) or summaries for reports.
