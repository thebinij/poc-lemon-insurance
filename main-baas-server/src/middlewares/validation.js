/**
 * Validation middleware using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @returns {Function} - Express middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessage
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

module.exports = {
  validateRequest
};
