const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('MongoDB is already connected.');
    return true;
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/firstcry_sentiment';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000 // Quick timeout to fallback if local mongo is down
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully to:', mongoURI);
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. Server will start in demo/fallback mode with local mock data.');
    console.error('Error details:', error.message);
    return false;
  }
}

module.exports = { connectDB, getIsConnected: () => isConnected };
