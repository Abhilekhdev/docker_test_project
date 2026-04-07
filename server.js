require('dotenv').config();
const app = require('./src/app');
const knex = require('./src/config/knex');

const PORT = process.env.PORT || 3000;

// Create tables if they don't exist
const createTables = require('./src/database/initDatabase');



// Start server
const startServer = async () => {
  await createTables();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'crud-res'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed. Exiting now.');
      knex.destroy(() => {
        console.log('Database connection closed.');
        process.exit(0);
      });
    });

    setTimeout(() => {
      console.error('Force close after 10s.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });
};

startServer();