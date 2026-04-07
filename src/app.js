const express = require('express');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');


const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const errorHandler = require('./middleware/errorHandler');
// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🔥 PostgreSQL API Server with Objection.js & Knex',
    version: '2.0.0',
    architecture: 'Route → Controller → Service → Model (Objection/Knex) → PostgreSQL',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users',
        'POST /api/users': 'Create user',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user',
        'GET /api/users/:id/orders': 'Get user with orders'
      },
      products: {
        'GET /api/products': 'Get all products',
        'POST /api/products': 'Create product',
        'GET /api/products/:id': 'Get product by ID',
        'PUT /api/products/:id': 'Update product',
        'DELETE /api/products/:id': 'Delete product'
      },
      orders: {
        'GET /api/orders': 'Get all orders',
        'POST /api/orders': 'Create order',
        'GET /api/orders/:id': 'Get order by ID',
        'GET /api/orders/user/:userId': 'Get orders by user',
        'DELETE /api/orders/:id': 'Delete order',
        'GET /api/orders/stats/overview': 'Get order statistics'
      }
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

module.exports = app;