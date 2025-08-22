// Validation layer exports
const { 
  validateInsuranceRequest, 
  insuranceSchemas, 
  commonSchemas 
} = require('./insuranceValidation');

module.exports = {
  validateInsuranceRequest,
  insuranceSchemas,
  commonSchemas
};
