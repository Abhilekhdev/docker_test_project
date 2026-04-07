const { Model } = require('objection');
const knex = require('../config/knex');

// Bind the knex instance to Objection.js
Model.knex(knex);
 
class BaseModel extends Model {
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = BaseModel;