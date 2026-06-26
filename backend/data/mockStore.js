const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'sampleData.json');

// Default initial database content
const defaultData = {
  users: [
    { id: "u1", name: "Center Head Administrator", email: "admin@firstcry.com", password: "admin", role: "admin" },
    { id: "u2", name: "Class Teacher Priya", email: "priya@firstcry.com", password: "teacher", role: "teacher" }
  ],
  parents: [
    { id: "p1", name: "Rahul Sharma", email: "rahul.sharma@example.com", phone: "+91 98765 43210", studentName: "Aarav Sharma", studentId: "FC-2026-001", classGrade: "Playgroup A", admissionStatus: "Admitted", createdAt: "2026-01-10T10:00:00.000Z" },
    { id: "p2", name: "Sneha Reddy", email: "sneha.reddy@example.com", phone: "+91 91234 56789", studentName: "Vihaan Reddy", studentId: "FC-2026-002", classGrade: "Nursery B", admissionStatus: "At-Risk", createdAt: "2026-02-14T11:30:00.000Z" },
    { id: "p3", name: "Amit Patel", email: "amit.patel@example.com", phone: "+91 88888 77777", studentName: "Diya Patel", studentId: "FC-2026-003", classGrade: "Toddler C", admissionStatus: "Admitted", createdAt: "2026-03-01T09:00:00.000Z" },
    { id: "p4", name: "Meera Nair", email: "meera.nair@example.com", phone: "+91 77777 66666", studentName: "Rohan Nair", studentId: "FC-2026-004", classGrade: "Kindergarten A", admissionStatus: "Registered", createdAt: "2026-04-18T14:15:00.000Z" },
    { id: "p5", name: "Vikram Malhotra", email: "vikram.m@example.com", phone: "+91 99999 88888", studentName: "Kavya Malhotra", studentId: "FC-2026-005", classGrade: "Nursery B", admissionStatus: "Withdrawn", createdAt: "2026-01-20T10:00:00.000Z" },
    { id: "p6", name: "Anjali Gupta", email: "anjali.gupta@example.com", phone: "+91 95555 44444", studentName: "Ishaan Gupta", studentId: "FC-2026-006", classGrade: "Playgroup A", admissionStatus: "Admitted", createdAt: "2026-05-02T16:00:00.000Z" },
    { id: "p7", name: "Rajesh Kumar", email: "rajesh.kumar@example.com", phone: "+91 94444 33333", studentName: "Aanya Kumar", studentId: "FC-2026-007", classGrade: "Toddler C", admissionStatus: "Enquired", createdAt: "2026-06-01T11:00:00.000Z" },
    { id: "p8", name: "Pooja Joshi", email: "pooja.j@example.com", phone: "+91 93333 22222", studentName: "Dev Joshi", studentId: "FC-2026-008", classGrade: "Kindergarten A", admissionStatus: "At-Risk", createdAt: "2026-02-10T10:00:00.000Z" }
  ],
  children: [
    { id: "c1", parentId: "p1", name: "Aarav Sharma", classGrade: "Playgroup A", dateOfBirth: null, createdAt: "2026-01-10T10:00:00.000Z" },
    { id: "c2", parentId: "p2", name: "Vihaan Reddy", classGrade: "Nursery B", dateOfBirth: null, createdAt: "2026-02-14T11:30:00.000Z" },
    { id: "c3", parentId: "p3", name: "Diya Patel", classGrade: "Toddler C", dateOfBirth: null, createdAt: "2026-03-01T09:00:00.000Z" },
    { id: "c4", parentId: "p4", name: "Rohan Nair", classGrade: "Kindergarten A", dateOfBirth: null, createdAt: "2026-04-18T14:15:00.000Z" },
    { id: "c5", parentId: "p5", name: "Kavya Malhotra", classGrade: "Nursery B", dateOfBirth: null, createdAt: "2026-01-20T10:00:00.000Z" },
    { id: "c6", parentId: "p6", name: "Ishaan Gupta", classGrade: "Playgroup A", dateOfBirth: null, createdAt: "2026-05-02T16:00:00.000Z" },
    { id: "c7", parentId: "p7", name: "Aanya Kumar", classGrade: "Toddler C", dateOfBirth: null, createdAt: "2026-06-01T11:00:00.000Z" },
    { id: "c8", parentId: "p8", name: "Dev Joshi", classGrade: "Kindergarten A", dateOfBirth: null, createdAt: "2026-02-10T10:00:00.000Z" }
  ],
  interactions: [
    {
      id: "i1",
      parentId: "p1",
      childId: "c1",
      type: "email",
      rawText: "The classroom learning sessions are absolutely great. My son Aarav loves his teacher. Excellent environment!",
      normalizedText: "the classroom learning sessions are absolutely great. my son aarav loves his teacher. excellent environment!",
      sentimentScore: 0.8,
      sentimentLabel: "Positive",
      rating: 5,
      extractedKeywords: ["Teacher interaction", "Infrastructure"],
      metadata: { portalLogins: 12, surveyCompleted: true, eventAttended: true },
      timestamp: "2026-06-20T10:15:00.000Z"
    },
    {
      id: "i2",
      parentId: "p2",
      childId: "c2",
      type: "survey",
      rawText: "I am extremely concerned about the bus safety. The van driver is driving too fast and we are getting late notifications.",
      normalizedText: "i am extremely concerned about the bus safety. the van driver is driving too fast and we are getting late notifications.",
      sentimentScore: -0.6,
      sentimentLabel: "Negative",
      rating: 2,
      extractedKeywords: ["Bus safety"],
      metadata: { portalLogins: 2, surveyCompleted: true, eventAttended: false },
      timestamp: "2026-06-21T09:30:00.000Z"
    },
    {
      id: "i3",
      parentId: "p3",
      childId: "c3",
      type: "portal_log",
      rawText: "Logged in to check the child syllabus updates.",
      normalizedText: "logged in to check the child syllabus updates.",
      sentimentScore: 0.1,
      sentimentLabel: "Neutral",
      rating: 3,
      extractedKeywords: ["Curriculum & activity"],
      metadata: { portalLogins: 24, surveyCompleted: true, eventAttended: true },
      timestamp: "2026-06-22T08:12:00.000Z"
    },
    {
      id: "i4",
      parentId: "p4",
      childId: "c4",
      type: "rsvp",
      rawText: "Diya will attend the musical annual function. Thank you for organizing this event.",
      normalizedText: "diya will attend the musical annual function. thank you for organizing this event.",
      sentimentScore: 0.5,
      sentimentLabel: "Positive",
      rating: 4,
      extractedKeywords: ["Curriculum & activity"],
      metadata: { portalLogins: 8, surveyCompleted: false, eventAttended: true },
      timestamp: "2026-06-23T11:45:00.000Z"
    },
    {
      id: "i5",
      parentId: "p8",
      childId: "c8",
      type: "email",
      rawText: "The academic homework load is very high for a kindergartener. Dev is feeling very stressed every evening. Please reduce this workload.",
      normalizedText: "the academic homework load is very high for a kindergartener. dev is feeling very stressed every evening. please reduce this workload.",
      sentimentScore: -0.7,
      sentimentLabel: "Negative",
      rating: 1,
      extractedKeywords: ["Homework load"],
      metadata: { portalLogins: 3, surveyCompleted: true, eventAttended: false },
      timestamp: "2026-06-24T15:20:00.000Z"
    },
    {
      id: "i6",
      parentId: "p6",
      childId: "c6",
      type: "survey",
      rawText: "The food quality and meal nutrition plan is very good. He is eating everything. Appreciate the support.",
      normalizedText: "the food quality and meal nutrition plan is very good. he is eating everything. appreciate the support.",
      sentimentScore: 0.75,
      sentimentLabel: "Positive",
      rating: 5,
      extractedKeywords: ["Food quality"],
      metadata: { portalLogins: 15, surveyCompleted: true, eventAttended: true },
      timestamp: "2026-06-18T12:00:00.000Z"
    },
    {
      id: "i7",
      parentId: "p2",
      childId: "c2",
      type: "email",
      rawText: "The classroom toys look broken and classrooms are sometimes dusty. Hygiene needs immediate improvement.",
      normalizedText: "the classroom toys look broken and classrooms are sometimes dusty. hygiene needs immediate improvement.",
      sentimentScore: -0.5,
      sentimentLabel: "Negative",
      rating: 2,
      extractedKeywords: ["Infrastructure"],
      metadata: { portalLogins: 2, surveyCompleted: true, eventAttended: false },
      timestamp: "2026-06-15T10:00:00.000Z"
    }
  ],
  meetings: [
    { id: "m1", parentId: "p2", title: "Bus Safety & Route Discussion", description: "Review van pick-up times, driver speeding concerns, and parent SMS alerts.", dateTime: "2026-06-26T10:00:00.000Z", status: "Scheduled", reminderSent: true, meetingNotes: "" },
    { id: "m2", parentId: "p8", title: "Homework Workload Review", description: "Discuss adjustment of kindergarten homework hours with teacher Priya.", dateTime: "2026-06-27T11:00:00.000Z", status: "Scheduled", reminderSent: false, meetingNotes: "" },
    { id: "m3", parentId: "p1", title: "Admission Onboarding Call", description: "Welcome call and documentation collection verification.", dateTime: "2026-01-15T15:00:00.000Z", status: "Completed", reminderSent: true, meetingNotes: "Documentation successfully verified. Aarav has settled down nicely." }
  ],
  analyticsCache: [
    { id: "c1", classGrade: "school-wide", date: "2026-06-20T00:00:00.000Z", avgSentimentScore: 0.8, avgEngagementIndex: 85, activeAlertsCount: 0, keyConcerns: [{ keyword: "Teacher interaction", count: 1 }] },
    { id: "c2", classGrade: "school-wide", date: "2026-06-21T00:00:00.000Z", avgSentimentScore: 0.1, avgEngagementIndex: 60, activeAlertsCount: 1, keyConcerns: [{ keyword: "Bus safety", count: 1 }] },
    { id: "c3", classGrade: "school-wide", date: "2026-06-22T00:00:00.000Z", avgSentimentScore: 0.1, avgEngagementIndex: 65, activeAlertsCount: 1, keyConcerns: [{ keyword: "Bus safety", count: 1 }] },
    { id: "c4", classGrade: "school-wide", date: "2026-06-23T00:00:00.000Z", avgSentimentScore: 0.25, avgEngagementIndex: 68, activeAlertsCount: 1, keyConcerns: [{ keyword: "Bus safety", count: 1 }, { keyword: "Curriculum & activity", count: 1 }] },
    { id: "c5", classGrade: "school-wide", date: "2026-06-24T00:00:00.000Z", avgSentimentScore: -0.05, avgEngagementIndex: 54, activeAlertsCount: 2, keyConcerns: [{ keyword: "Homework load", count: 1 }, { keyword: "Bus safety", count: 1 }] }
  ]
};

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load data helper
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading mock database JSON, using default initial data.", err);
    return defaultData;
  }
}

// Save data helper
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving mock database JSON:", err);
  }
}

module.exports = {
  loadData,
  saveData
};
