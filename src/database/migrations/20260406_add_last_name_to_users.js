exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('last_name', 100).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('last_name');
  });
};