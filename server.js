require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const routeConf = require('./src/config/RouteConf');
const dbConf = require('./src/config/DBConf');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware to parse URL-encoded and JSON bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Enable CORS
app.use(cors({ origin: true, credentials: true }));

// Set application routes
routeConf(express, app);

// Custom error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Error: ${err}`);
  process.exit(1);
});

// Connect to the database and start the server
const port = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await dbConf();
    app.listen(port, () =>
      console.log(`Server is running and listening on port ${port}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

startServer();
