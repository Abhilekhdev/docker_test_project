const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ProductService = require('./productService');

class OrderService {
  static async getAllOrders() {
    try {
      const orders = await Order.query()
        .withGraphFetched('[user, product]')
        .orderBy('created_at', 'desc');

      return orders;
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  static async createOrder(orderData) {
    try {
      const { user_id, product_id, quantity } = orderData;

      // Validate user exists
      const user = await User.query().findById(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate product exists and has stock
      const product = await Product.query().findById(product_id);
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Calculate total price
      const totalPrice = product.price * quantity;

      // Create order in transaction
      const order = await Order.transaction(async (trx) => {
        // Create the order
        const newOrder = await Order.query(trx).insert({
          user_id,
          product_id,
          quantity,
          total_price: totalPrice
        });

        // Update product stock
        await Product.query(trx)
          .patchAndFetchById(product_id, { stock: product.stock - quantity });

        return newOrder;
      });

      // Return order with relations
      return await Order.query()
        .findById(order.id)
        .withGraphFetched('[user, product]');

    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  static async getOrderById(id) {
    try {
      const order = await Order.query()
        .findById(id)
        .withGraphFetched('[user, product]');

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  static async getOrdersByUser(userId) {
    try {
      const orders = await Order.query()
        .where('user_id', userId)
        .withGraphFetched('product')
        .orderBy('created_at', 'desc');

      return orders;
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }

  static async deleteOrder(id) {
    try {
      const order = await Order.query().findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Return stock to product
      await Product.query()
        .increment('stock', order.quantity)
        .where('id', order.product_id);

      await Order.query().deleteById(id);
      return order;
    } catch (error) {
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  }

  static async getOrderStats() {
    try {
      const stats = await Order.query()
        .select([
          Order.raw('COUNT(*) as total_orders'),
          Order.raw('SUM(total_price) as total_revenue'),
          Order.raw('AVG(total_price) as avg_order_value')
        ])
        .first();

      return stats;
    } catch (error) {
      throw new Error(`Failed to get order stats: ${error.message}`);
    }
  }
}

module.exports = OrderService;