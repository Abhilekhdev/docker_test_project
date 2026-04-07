const knex = require('../config/knex');

const createTables = async () => {
  try {
    console.log('🔧 Checking/creating database tables...');

    // Test connection
    await knex.raw('SELECT 1');
    console.log('✅ Database connection verified');

    // Create users table
    const usersExists = await knex.schema.hasTable('users');
    if (!usersExists) {
      await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.string('email', 100).unique().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('✅ Users table created');
    } else {
      console.log('✅ Users table exists');
    }

    // Create products table
    const productsExists = await knex.schema.hasTable('products');
    if (!productsExists) {
      await knex.schema.createTable('products', (table) => {
        table.increments('id').primary();
        table.string('name', 150).notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.integer('stock').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('✅ Products table created');
    } else {
      console.log('✅ Products table exists');
      // Check if updated_at column exists, if not add it
      const hasUpdatedAt = await knex.schema.hasColumn('products', 'updated_at');
      if (!hasUpdatedAt) {
        await knex.schema.alterTable('products', (table) => {
          table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
        console.log('✅ Added updated_at column to products table');
      }
    }

    // Create orders table
    const ordersExists = await knex.schema.hasTable('orders');
    if (!ordersExists) {
      await knex.schema.createTable('orders', (table) => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.integer('product_id').references('id').inTable('products').onDelete('CASCADE');
        table.integer('quantity').notNullable();
        table.decimal('total_price', 10, 2).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('✅ Orders table created');
    } else {
      console.log('✅ Orders table exists');
      // Check if updated_at column exists, if not add it
      const hasUpdatedAt = await knex.schema.hasColumn('orders', 'updated_at');
      if (!hasUpdatedAt) {
        await knex.schema.alterTable('orders', (table) => {
          table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
        console.log('✅ Added updated_at column to orders table');
      }
    }

    console.log('✅ All database tables are ready');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    throw err;
  }
};

module.exports = createTables;