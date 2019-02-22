const { disallow } = require('feathers-hooks-common');

const processMessage = require('../../hooks/process-message');

const populateUser = require('../../hooks/populate-user');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [processMessage()],
    update: [disallow()],
    patch: [disallow()],
    remove: [disallow()],
  },

  after: {
    all: [populateUser()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
