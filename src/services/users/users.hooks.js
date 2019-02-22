const { disallow } = require('feathers-hooks-common');

const newUser = require('../../hooks/new-user');

const processUserUpdate = require('../../hooks/process-user-update');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [newUser()],
    update: [disallow()],
    patch: [processUserUpdate()],
    remove: [disallow()],
  },

  after: {
    all: [],
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
