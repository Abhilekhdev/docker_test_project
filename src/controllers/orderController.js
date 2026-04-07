const OrderService = require('../services/orderService');

class OrderController {
  static async getOrders(req, res) {
    try {
      const orders = await OrderService.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async createOrder(req, res) {
    try {
      const { user_id, product_id, quantity } = req.body;
      if (!user_id || !product_id || !quantity) {
        return res.status(400).json({ success: false, error: 'user_id, product_id, and quantity are required' });
      }

      const order = await OrderService.createOrder({ user_id, product_id, quantity });
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);
      res.json({ success: true, data: order });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getOrdersByUser(req, res) {
    try {
      const { userId } = req.params;
      const orders = await OrderService.getOrdersByUser(userId);
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await OrderService.deleteOrder(id);
      res.json({ success: true, data: order });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getOrderStats(req, res) {
    try {
      const stats = await OrderService.getOrderStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = OrderController;