const Product = require('../models/productModel');

class ProductService {
  static async getAllProducts() {
    try {
      const products = await Product.query().orderBy('created_at', 'desc');
      return products;
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  static async createProduct(productData) {
    try {
      const { name, price, stock = 0 } = productData;

      const product = await Product.query().insert({
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock)
      });

      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  static async getProductById(id) {
    try {
      const product = await Product.query().findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  static async updateProduct(id, productData) {
    try {
      const product = await Product.query().findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      const updateData = {};
      if (productData.name) updateData.name = productData.name.trim();
      if (productData.price !== undefined) updateData.price = parseFloat(productData.price);
      if (productData.stock !== undefined) updateData.stock = parseInt(productData.stock);

      const updatedProduct = await Product.query().patchAndFetchById(id, updateData);
      return updatedProduct;
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  static async deleteProduct(id) {
    try {
      const product = await Product.query().findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      await Product.query().deleteById(id);
      return product;
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  static async updateStock(id, quantity) {
    try {
      const product = await Product.query().findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      const updatedProduct = await Product.query()
        .patchAndFetchById(id, { stock: product.stock - quantity });

      return updatedProduct;
    } catch (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }
}

module.exports = ProductService;