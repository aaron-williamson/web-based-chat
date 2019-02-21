const feathers = require('@feathersjs/feathers');
const newUser = require('../../src/hooks/new-user');

describe('\'new-user\' hook', () => {
  let app;

  beforeEach(() => {
    app = feathers();

    app.use('/dummy', {
      async get(id) {
        return { id };
      },
    });

    app.service('dummy').hooks({
      before: newUser(),
    });
  });

  it('runs the hook', async () => {
    expect.assertions(1);
    const result = await app.service('dummy').get('test');
    expect(result).toEqual({ id: 'test' });
  });
});
