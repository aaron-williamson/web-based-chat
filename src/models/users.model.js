const NeDB = require('nedb');
const path = require('path');

module.exports = function (app) {
  const dbPath = app.get('nedb');
  const Model = new NeDB({
    filename: path.join(dbPath, 'users.db'),
    autoload: true,
  });

  // Make sure user names are unique
  Model.ensureIndex({ fieldName: 'name', unique: true, sparse: true }, (err) => {
    if (err !== null) {
      throw `Error creating user name index: ${err}`;
    }
  });

  return Model;
};
