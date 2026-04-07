const ProductService = require('../services/productService');

class ProductController {
  static async getProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts();
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createProduct(req, res) {
    try {
      const { name, price, stock } = req.body;
      if (!name || !price) {
        return res.status(400).json({ success: false, error: 'Name and price are required' });
      }
      const product = await ProductService.createProduct({ name, price, stock });
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      res.json({ success: true, data: product });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, price, stock } = req.body;

      const product = await ProductService.updateProduct(id, { name, price, stock });
      res.json({ success: true, data: product });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductService.deleteProduct(id);
      res.json({ success: true, data: product });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ProductController;