const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('../config/db');
const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Interaction = require('../models/Interaction');
const AnalyticsCache = require('../models/AnalyticsCache');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const mockStore = require('../data/mockStore');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('Seeding Database...');
  
  // Load mock data values
  const seedSource = mockStore.loadData();
  
  // Try connecting to MongoDB
  const isMongoConnected = await connectDB();
  
  if (isMongoConnected) {
    try {
      // Clear collections
      await Parent.deleteMany({});
      await Child.deleteMany({});
      await Interaction.deleteMany({});
      await AnalyticsCache.deleteMany({});
      await Meeting.deleteMany({});
      await User.deleteMany({});
      
      console.log('Cleared existing MongoDB collections.');

      // 1. Seed Users
      const createdUsers = await User.insertMany(seedSource.users.map(u => ({
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role
      })));
      console.log(`Seeded ${createdUsers.length} system users.`);

      // 2. Seed Parents
      const parentMap = {};
      for (const p of seedSource.parents) {
        const parentDoc = await Parent.create({
          name: p.name,
          email: p.email,
          phone: p.phone,
          studentName: p.studentName,
          studentId: p.studentId,
          classGrade: p.classGrade,
          admissionStatus: p.admissionStatus,
          createdAt: new Date(p.createdAt)
        });
        parentMap[p.id] = parentDoc._id;
      }
      console.log(`Seeded ${Object.keys(parentMap).length} parents.`);

      // 2b. Seed Children
      const childMap = {};
      if (seedSource.children) {
        for (const c of seedSource.children) {
          if (parentMap[c.parentId]) {
            const childDoc = await Child.create({
              parentId: parentMap[c.parentId],
              name: c.name,
              classGrade: c.classGrade,
              dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth) : null,
              createdAt: new Date(c.createdAt)
            });
            childMap[c.id] = childDoc._id;
          }
        }
        console.log(`Seeded ${Object.keys(childMap).length} children.`);
      }

      // 3. Seed Interactions
      let interactionCount = 0;
      for (const interaction of seedSource.interactions) {
        if (parentMap[interaction.parentId]) {
          await Interaction.create({
            parentId: parentMap[interaction.parentId],
            childId: childMap[interaction.childId] || null,
            type: interaction.type,
            rawText: interaction.rawText,
            normalizedText: interaction.normalizedText,
            sentimentScore: interaction.sentimentScore,
            sentimentLabel: interaction.sentimentLabel,
            rating: interaction.rating,
            extractedKeywords: interaction.extractedKeywords,
            metadata: interaction.metadata,
            timestamp: new Date(interaction.timestamp)
          });
          interactionCount++;
        }
      }
      console.log(`Seeded ${interactionCount} interactions.`);

      // 4. Seed Meetings
      let meetingCount = 0;
      for (const m of seedSource.meetings) {
        if (parentMap[m.parentId]) {
          await Meeting.create({
            parentId: parentMap[m.parentId],
            title: m.title,
            description: m.description,
            dateTime: new Date(m.dateTime),
            status: m.status,
            reminderSent: m.reminderSent,
            meetingNotes: m.meetingNotes
          });
          meetingCount++;
        }
      }
      console.log(`Seeded ${meetingCount} meetings.`);

      // 5. Seed Analytics Cache
      const cacheDocs = await AnalyticsCache.insertMany(seedSource.analyticsCache.map(c => ({
        classGrade: c.classGrade,
        date: new Date(c.date),
        avgSentimentScore: c.avgSentimentScore,
        avgEngagementIndex: c.avgEngagementIndex,
        activeAlertsCount: c.activeAlertsCount,
        keyConcerns: c.keyConcerns
      })));
      console.log(`Seeded ${cacheDocs.length} daily analytics summaries.`);

      console.log('🎉 MongoDB seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during MongoDB seeding:', error);
      process.exit(1);
    }
  } else {
    console.warn('⚠️ Seeding: MongoDB is offline. Seeding operation has initialized sampleData.json locally.');
    mockStore.saveData(seedSource);
    console.log('🎉 Mock store seeding completed locally!');
    process.exit(0);
  }
}

seed();
