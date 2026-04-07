const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'crud-with-postgres'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: { 
      directory: path.join(__dirname, 'src/database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds')
    }
  }
};