const mongoose = require('mongoose');

const dbConf = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err}`);
    process.exit(1);
  }
};

module.exports = dbConf;
