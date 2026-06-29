const mongoose = require('mongoose');
const { Pool } = require('pg');

let isConnected = false;
let dbType = 'none'; // 'mongodb', 'postgres', or 'none'
let pgPool = null;

async function connectDB() {
  if (isConnected) {
    console.log(`Database (${dbType}) is already connected.`);
    return true;
  }

  const connectionURI = process.env.MONGO_URI || 'postgresql://postgres.gcrhbkptymbbbvwvsmst:Nikshith%40123@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';
  
  if (connectionURI.startsWith('postgres://') || connectionURI.startsWith('postgresql://')) {
    try {
      console.log('🔌 Connecting to Supabase PostgreSQL...');
      pgPool = new Pool({
        connectionString: connectionURI,
        ssl: { rejectUnauthorized: false } // Required for Supabase
      });

      // Test connection
      await pgPool.query('SELECT NOW()');
      
      isConnected = true;
      dbType = 'postgres';
      console.log('✅ Connected successfully to Supabase PostgreSQL!');

      // Auto-provision SQL tables if they do not exist
      await provisionTables();
      return true;
    } catch (error) {
      console.warn('⚠️ Supabase connection failed. Falling back to local mock data.');
      console.error('Error details:', error.message);
      isConnected = false;
      dbType = 'none';
      return false;
    }
  } else {
    // MongoDB connection flow
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(connectionURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });
      
      isConnected = true;
      dbType = 'mongodb';
      console.log('✅ Connected successfully to MongoDB:', connectionURI);
      return true;
    } catch (error) {
      console.warn('⚠️ MongoDB connection failed. Server will start in demo/fallback mode with local mock data.');
      console.error('Error details:', error.message);
      isConnected = false;
      dbType = 'none';
      return false;
    }
  }
}

async function provisionTables() {
  console.log('🔨 Verifying PostgreSQL table structures...');
  try {
    // Create parents table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        class_grade VARCHAR(100) NOT NULL,
        admission_status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create children table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        class_grade VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create interactions table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
        child_id INT REFERENCES children(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        raw_text TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        sentiment_score DECIMAL(5, 2) NOT NULL,
        sentiment_label VARCHAR(50) NOT NULL,
        rating INT DEFAULT 3,
        extracted_keywords JSONB,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create meetings table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        parent_id INT REFERENCES parents(id) ON DELETE CASCADE,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        date_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Scheduled',
        reminder_sent BOOLEAN DEFAULT FALSE,
        meeting_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Dynamic schema migration: ensure meeting_notes column exists if table was already created
    await pgPool.query(`
      ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_notes TEXT DEFAULT '';
    `);

    // Migrate id column if it was previously SERIAL (integer)
    await pgPool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'integer'
        ) THEN
          DROP TABLE IF EXISTS users CASCADE;
        END IF;
      END $$;
    `);

    // Create users table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        phone VARCHAR(50),
        assigned_class VARCHAR(100),
        assigned_student_ids JSONB,
        status VARCHAR(50) DEFAULT 'active',
        last_login TIMESTAMP,
        avatar VARCHAR(255),
        login_history JSONB,
        activity_logs JSONB,
        parent_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure all columns exist for existing users tables
    await pgPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_class VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_student_ids JSONB;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_history JSONB;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_logs JSONB;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id VARCHAR(100);
    `);

    // Create analytics_cache table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id SERIAL PRIMARY KEY,
        class_grade VARCHAR(100) NOT NULL DEFAULT 'school-wide',
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        avg_sentiment_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
        avg_engagement_index INT NOT NULL DEFAULT 0,
        active_alerts_count INT NOT NULL DEFAULT 0,
        key_concerns JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✨ PostgreSQL tables verified/provisioned successfully!');
  } catch (error) {
    console.error('❌ Failed to provision PostgreSQL tables:', error.message);
    throw error;
  }
}

module.exports = {
  connectDB,
  getIsConnected: () => isConnected,
  getDbType: () => dbType,
  getPgPool: () => pgPool,
  query: (text, params) => {
    if (!pgPool) throw new Error('PostgreSQL Pool is not initialized');
    return pgPool.query(text, params);
  }
};
