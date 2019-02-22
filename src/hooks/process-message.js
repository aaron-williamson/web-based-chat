// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const Errors = require('@feathersjs/errors');
const Joi = require('joi');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async (context) => {
    const { data } = context;

    // Validate the message
    const schema = Joi.object().keys({
      text: Joi.string().min(1).max(400).required(),
      user: Joi.string().required(),
    });
    const result = Joi.validate(data, schema);

    if (result.error !== null) {
      throw new Errors.Unprocessable('Invalid JSON data', result.error.details);
    }

    context.data = result.value;

    // Sanitize the text
    const DOMPurify = createDOMPurify((new JSDOM('')).window);
    context.data.text = DOMPurify.sanitize(context.data.text);

    // Add a date to the message
    context.data.createdAt = new Date().getTime();

    return context;
  };
};
