exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add date of birth column
    table.date('dob').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Remove date of birth column
    table.dropColumn('dob');
  });
};