

const newUser = require('../../hooks/new-user');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [newUser()],
    update: [],
    patch: [],
    remove: [],
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
