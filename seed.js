require('dotenv').config();
const mongoose = require('mongoose');
const Keyword = require('./models/Keyword');
const GlobalWhitelist = require('./models/GlobalWhitelist');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Keyword.deleteMany({});
    await GlobalWhitelist.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed Keywords
    const keywords = [
      { word: 'porn', category: 'PORN', isEnabled: true },
      { word: 'sex', category: 'PORN', isEnabled: true },
      { word: 'casino', category: 'GAMBLING', isEnabled: true },
      { word: 'bet', category: 'GAMBLING', isEnabled: true },
      { word: 'violence', category: 'VIOLENCE', isEnabled: true },
    ];

    await Keyword.insertMany(keywords);
    console.log('✅ Seeded 5 keywords');

    // Seed Global Whitelist
    const whitelist = [
      { packageName: 'com.google.android.youtube', appName: 'YouTube' },
      { packageName: 'com.whatsapp', appName: 'WhatsApp' },
    ];

    await GlobalWhitelist.insertMany(whitelist);
    console.log('✅ Seeded 2 whitelist apps');

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => {
  seedData();
});
