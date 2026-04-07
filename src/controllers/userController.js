const UserService = require('../services/userService');

class UserController {
  static async getUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createUser(req, res) {
    try {
      const { name, email, dob } = req.body;
      console.log('📥 Received POST request:', { name, email, dob });

      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required' });
      }

      const user = await UserService.createUser({ name, email, dob });
      console.log('📤 Returning user:', user);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, dob } = req.body;

      const user = await UserService.updateUser(id, { name, email, dob });
      res.json({ success: true, data: user });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.deleteUser(id);
      res.json({ success: true, data: user });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getUserWithOrders(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserWithOrders(id);
      res.json({ success: true, data: user });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = UserController;