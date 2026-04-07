const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  static get tableName() {
    return 'products';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'price'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 150 },
        price: { type: 'number', minimum: 0 },
        stock: { type: 'integer', minimum: 0, default: 0 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Order = require('./orderModel');

    return {
      orders: {
        relation: BaseModel.HasManyRelation,
        modelClass: Order,
        join: {
          from: 'products.id',
          to: 'orders.product_id'
        }
      }
    };
  }
}

module.exports = Product;