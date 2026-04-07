const User = require('../models/userModel');

class UserService {
  static async getAllUsers() {
    try {
      const users = await User.query().orderBy('created_at', 'desc');
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  static async createUser(userData) {
    try {
      const { name, email, dob } = userData;

      // Check if email already exists
      const existingUser = await User.query().where('email', email).first();
      if (existingUser) {
        throw new Error('Email already exists');
      }

      const user = await User.query().insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        dob: dob || null // Optional field
      });

      return user;
    } catch (error) {
      if (error.message.includes('Email already exists')) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async getUserById(id) {
    try {
      const user = await User.query().findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  static async updateUser(id, userData) {
    try {
      const { name, email, dob } = userData;

      // Check if user exists
      const existingUser = await User.query().findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check if email is taken by another user
      if (email) {
        const emailUser = await User.query()
          .where('email', email.toLowerCase().trim())
          .whereNot('id', id)
          .first();
        if (emailUser) {
          throw new Error('Email already exists');
        }
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (dob !== undefined) updateData.dob = dob; // Allow null values

      const user = await User.query().patchAndFetchById(id, updateData);
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async deleteUser(id) {
    try {
      const user = await User.query().findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await User.query().deleteById(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  static async getUserWithOrders(id) {
    try {
      const user = await User.query()
        .findById(id)
        .withGraphFetched('orders.[product]');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user with orders: ${error.message}`);
    }
  }
}

module.exports = UserService;