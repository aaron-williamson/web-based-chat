// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const Errors = require('@feathersjs/errors');
const Joi = require('joi');
const NeDB = require('nedb'); // Need this and path because $inc doesn't work with upsert for the incremental user ids
const path = require('path'); // so we have to use the database directly instead of through the feathers interface

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async (context) => {
    const { app, data } = context;

    // Validate the message
    const schema = Joi.object().keys({});
    const result = Joi.validate(data, schema);

    if (result.error !== null) {
      throw new Errors.Unprocessable('Create request should not include any information', result.error.details);
    }

    // Set the user to offline by default
    result.value.onlineCount = 0;

    // Create the username
    let userExists = false;
    do { // If name 'User${userNum{' is taken, keep trying
      const userNum = await getUserNum(app);
      result.value.name = `User${userNum}`;
      const queryResult = await app.service('users').find({ query: { name: result.value.name } });
      userExists = queryResult.total > 0;
    } while (userExists);

    // Assign the default color
    result.value.color = 'FFFFFF';

    context.data = result.value;

    return context;
  };
};

async function getUserNum(app) {
  const dbPath = app.get('nedb');
  const db = new NeDB({
    filename: path.join(dbPath, 'users.db'),
    autoload: true,
  });

  const promise = new Promise((resolve, reject) => {
    db.update(
      { _id: '__usernum__' },
      { $inc: { seq: 1 } },
      { upsert: true, returnUpdatedDocs: true },
      (err, numAffected, affectedDocuments) => {
        if (err !== null || numAffected !== 1) {
          reject(Errors[502]('Could not assign username'));
        }

        resolve(affectedDocuments.seq);
      },
    );
  });

  return promise;
}
