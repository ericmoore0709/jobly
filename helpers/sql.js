const { BadRequestError } = require("../expressError");

/**
 * Attempts to convert data to SQL fragments for including in DB partial update queries.
 * @param {*} dataToUpdate the data values to update
 * @param {*} jsToSql the JS to convert to SQL
 * @returns `setCols` string of "set X = Y" fragments for SQL update, `values` array of values from updated data
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // get keys from data
  const keys = Object.keys(dataToUpdate);

  // if there are no keys, throw error
  if (keys.length === 0) throw new BadRequestError("No data");

  // map each key to a string -- 'colName = $indx+1'
  // i.e. {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
