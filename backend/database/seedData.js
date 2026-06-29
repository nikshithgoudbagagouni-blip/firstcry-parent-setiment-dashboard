const dotenv = require('dotenv');
const path = require('path');
const db = require('../config/db');
const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Interaction = require('../models/Interaction');
const AnalyticsCache = require('../models/AnalyticsCache');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const mockStore = require('../data/mockStore');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('🌱 Starting database seeding pipeline...');
  
  // Load mock data values
  const seedSource = mockStore.loadData();
  
  // Connect to Database
  const isConnected = await db.connectDB();
  
  if (isConnected) {
    try {
      if (db.getDbType() === 'postgres') {
        console.log('⚡ Detected PostgreSQL database. Seeding SQL tables...');

        // 1. Truncate all tables
        await db.query(`TRUNCATE TABLE parents, children, interactions, meetings, users, analytics_cache CASCADE;`);
        console.log('🗑️  Truncated existing SQL tables.');

        // 2. Seed Users
        for (const u of seedSource.users) {
          await db.query(
            `INSERT INTO users (id, name, email, password, role, phone, assigned_class, 
             assigned_student_ids, status, last_login, avatar, login_history, activity_logs, parent_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              u.id,
              u.name,
              u.email,
              u.password,
              u.role,
              u.phone || '',
              u.assignedClass || '',
              JSON.stringify(u.assignedStudentIds || []),
              u.status || 'active',
              u.lastLogin ? new Date(u.lastLogin) : null,
              u.avatar || '',
              JSON.stringify(u.loginHistory || []),
              JSON.stringify(u.activityLogs || []),
              u.parentId || '',
              u.createdAt ? new Date(u.createdAt) : new Date()
            ]
          );
        }
        console.log(`👤 Seeded ${seedSource.users.length} users.`);

        // 3. Seed Parents
        const parentMap = {};
        for (const p of seedSource.parents) {
          const res = await db.query(
            `INSERT INTO parents (name, email, phone, student_name, student_id, class_grade, admission_status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [p.name, p.email, p.phone, p.studentName, p.studentId, p.classGrade, p.admissionStatus, new Date(p.createdAt)]
          );
          parentMap[p.id] = res.rows[0].id;
        }
        console.log(`👪 Seeded ${Object.keys(parentMap).length} parents.`);

        // 4. Seed Children
        const childMap = {};
        if (seedSource.children) {
          for (const c of seedSource.children) {
            const parentDbId = parentMap[c.parentId];
            if (parentDbId) {
              const res = await db.query(
                `INSERT INTO children (parent_id, name, class_grade, date_of_birth, created_at)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [parentDbId, c.name, c.classGrade, c.dateOfBirth ? new Date(c.dateOfBirth) : null, new Date(c.createdAt)]
              );
              childMap[c.id] = res.rows[0].id;
            }
          }
          console.log(`👶 Seeded ${Object.keys(childMap).length} children.`);
        }

        // 5. Seed Interactions
        let interactionCount = 0;
        for (const i of seedSource.interactions) {
          const parentDbId = parentMap[i.parentId];
          const childDbId = childMap[i.childId];
          if (parentDbId) {
            await db.query(
              `INSERT INTO interactions (parent_id, child_id, type, raw_text, normalized_text, sentiment_score, sentiment_label, rating, extracted_keywords, metadata, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                parentDbId,
                childDbId || null,
                i.type,
                i.rawText,
                i.normalizedText,
                i.sentimentScore,
                i.sentimentLabel,
                i.rating,
                JSON.stringify(i.extractedKeywords),
                JSON.stringify(i.metadata),
                new Date(i.timestamp)
              ]
            );
            interactionCount++;
          }
        }
        console.log(`💬 Seeded ${interactionCount} interactions.`);

        // 6. Seed Meetings
        let meetingCount = 0;
        for (const m of seedSource.meetings) {
          const parentDbId = parentMap[m.parentId];
          if (parentDbId) {
            await db.query(
              `INSERT INTO meetings (parent_id, title, description, date_time, status, reminder_sent, meeting_notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                parentDbId,
                m.title,
                m.description,
                new Date(m.dateTime),
                m.status,
                m.reminderSent,
                m.meetingNotes
              ]
            );
            meetingCount++;
          }
        }
        console.log(`📅 Seeded ${meetingCount} meetings.`);

        // 7. Seed AnalyticsCache
        for (const c of seedSource.analyticsCache) {
          await db.query(
            `INSERT INTO analytics_cache (class_grade, date, avg_sentiment_score, avg_engagement_index, active_alerts_count, key_concerns)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              c.classGrade,
              new Date(c.date),
              c.avgSentimentScore,
              c.avgEngagementIndex,
              c.activeAlertsCount,
              JSON.stringify(c.keyConcerns)
            ]
          );
        }
        console.log(`📈 Seeded ${seedSource.analyticsCache.length} daily analytics summaries.`);

        console.log('🎉 PostgreSQL database seeding completed successfully!');
        process.exit(0);
      } else {
        console.log('⚡ Detected MongoDB database. Seeding Mongo collections...');
        
        // Clear collections
        await Parent.deleteMany({});
        await Child.deleteMany({});
        await Interaction.deleteMany({});
        await AnalyticsCache.deleteMany({});
        await Meeting.deleteMany({});
        await User.deleteMany({});
        
        console.log('🗑️  Cleared existing MongoDB collections.');

        // Seed Users
        const createdUsers = await User.insertMany(seedSource.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          phone: u.phone,
          assignedClass: u.assignedClass,
          assignedStudentIds: u.assignedStudentIds,
          status: u.status,
          lastLogin: u.lastLogin,
          avatar: u.avatar,
          loginHistory: u.loginHistory,
          activityLogs: u.activityLogs,
          parentId: u.parentId,
          createdAt: u.createdAt
        })));
        console.log(`👤 Seeded ${createdUsers.length} system users.`);

        // Seed Parents
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
        console.log(`👪 Seeded ${Object.keys(parentMap).length} parents.`);

        // Seed Children
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
          console.log(`👶 Seeded ${Object.keys(childMap).length} children.`);
        }

        // Seed Interactions
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
        console.log(`💬 Seeded ${interactionCount} interactions.`);

        // Seed Meetings
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
        console.log(`📅 Seeded ${meetingCount} meetings.`);

        // Seed Analytics Cache
        const cacheDocs = await AnalyticsCache.insertMany(seedSource.analyticsCache.map(c => ({
          classGrade: c.classGrade,
          date: new Date(c.date),
          avgSentimentScore: c.avgSentimentScore,
          avgEngagementIndex: c.avgEngagementIndex,
          activeAlertsCount: c.activeAlertsCount,
          keyConcerns: c.keyConcerns
        })));
        console.log(`📈 Seeded ${cacheDocs.length} daily analytics summaries.`);

        console.log('🎉 MongoDB seeding completed successfully!');
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error during database seeding:', error);
      process.exit(1);
    }
  } else {
    console.warn('⚠️ Seeding: Database is offline. Seeding operation fallback initialized sampleData.json locally.');
    mockStore.saveData(seedSource);
    console.log('🎉 Mock store seeding completed locally!');
    process.exit(0);
  }
}

seed();
