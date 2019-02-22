// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const Errors = require('@feathersjs/errors');
const Joi = require('joi');

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const { data } = context;

    // Validate the message
    const schema = Joi.object().keys({
      color: Joi.string().regex(/^[A-F0-9]{6}$/),
      name: Joi.string().min(1).max(32),
      online: Joi.boolean(),
    });
    const result = Joi.validate(data, schema);

    if (result.error !== null) {
      throw new Errors.Unprocessable('Invalid JSON data', result.error.details);
    }

    context.data = result.value;

    return context;
  };
};
