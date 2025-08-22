const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  insuredDetail: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    extension: Joi.string().pattern(/^\+?\d{1,4}$/).required(),
    mobileNumber: Joi.string().pattern(/^\d{7,15}$/).required(),
    email: Joi.string().email().required()
  }).required(),

  sessionToken: Joi.string().min(1).required(),

  selectedPlan: Joi.array().items(Joi.string().min(1)).min(1).required(),

  passengers: Joi.array().items(
    Joi.object({
      fullName: Joi.string().min(2).max(100).required(),
      dateOfBirth: Joi.date().iso().max('now').required(),
      passportNumber: Joi.string().min(1).max(50).required(),
      nationality: Joi.string().length(2).required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      civilId: Joi.string().allow('').optional(),
      classification: Joi.string().valid('adult', 'child', 'infant').required(),
      isPrimary: Joi.boolean().required()
    })
  ).min(1).required()
};

const insuranceSchemas = {
  travel: {
    GetAvailablePlans: Joi.object({
      insuredDetail: commonSchemas.insuredDetail,
      travelDetail: Joi.object({
        tripType: Joi.string().valid('one-way', 'round-trip', 'multi-city').required(),
        departureCountry: Joi.string().length(2).required(),
        destinationCountry: Joi.string().length(2).required(),
        departureDate: Joi.date().iso().min('now').required(),
        adultCount: Joi.string().pattern(/^\d+$/).required(),
        childCount: Joi.string().pattern(/^\d+$/).required(),
        infantCount: Joi.string().pattern(/^\d+$/).required()
      }).required()
    }),

    SaveSelectedPlan: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      selectedPlan: commonSchemas.selectedPlan
    }),

    ProceedPayment: Joi.object({
      amount: Joi.number().positive().required(),
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required(),
      sessionToken: commonSchemas.sessionToken,
      passengers: commonSchemas.passengers,
      success_url: Joi.string().uri().optional(),
      cancel_url: Joi.string().uri().optional(),
      additionalInfo: Joi.object({
        nationality: Joi.string().length(2).optional(),
        dateOfBirth: Joi.date().iso().max('now').optional(),
        passportNumber: Joi.string().min(1).max(50).optional()
      }).optional(),
      utmParams: Joi.string().optional()
    }),

    ConfirmPurchase: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required()
    })
  },

  motor: {
    GetAvailablePlans: Joi.object({
      insuredDetail: commonSchemas.insuredDetail,
      vehicleDetail: Joi.object({
        vehicleType: Joi.string().valid('car', 'motorcycle', 'truck', 'van', 'bus').required(),
        licensePlate: Joi.string().min(3).max(20).required(),
        engineCapacity: Joi.string().pattern(/^\d+cc$/).required(),
        make: Joi.string().min(2).max(50).required(),
        model: Joi.string().min(1).max(50).required(),
        year: Joi.string().pattern(/^\d{4}$/).required()
      }).required()
    }),

    SaveSelectedPlan: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      selectedPlan: commonSchemas.selectedPlan
    }),

    ProceedPayment: Joi.object({
      amount: Joi.number().positive().required(),
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required(),
      sessionToken: commonSchemas.sessionToken,
      passengers: commonSchemas.passengers
    }),

    ConfirmPurchase: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required()
    })
  },

  health: {
    GetAvailablePlans: Joi.object({
      insuredDetail: commonSchemas.insuredDetail,
      healthDetail: Joi.object({
        coverageType: Joi.string().valid('basic', 'comprehensive', 'premium').required(),
        age: Joi.number().integer().min(18).max(100).required(),
        medicalHistory: Joi.string().valid('none', 'minor', 'moderate', 'major').required(),
        preExistingConditions: Joi.boolean().required(),
        familyHistory: Joi.string().min(1).max(100).optional()
      }).required()
    }),

    SaveSelectedPlan: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      selectedPlan: commonSchemas.selectedPlan
    }),

    ProceedPayment: Joi.object({
      amount: Joi.number().positive().required(),
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required(),
      sessionToken: commonSchemas.sessionToken,
      passengers: commonSchemas.passengers
    }),

    ConfirmPurchase: Joi.object({
      sessionToken: commonSchemas.sessionToken,
      channelCode: Joi.string().min(1).required(),
      channel: Joi.string().min(1).required(),
      source: Joi.string().min(1).required()
    })
  }
};

function validateInsuranceRequest(insuranceType, endpoint, data) {
  try {
    const schemaSelection = Joi.object({
      insuranceType: Joi.string().valid('travel', 'motor', 'health').required(),
      endpoint: Joi.string().valid('GetAvailablePlans', 'SaveSelectedPlan', 'ProceedPayment', 'ConfirmPurchase').required()
    });

    const { error: selectionError } = schemaSelection.validate({ insuranceType, endpoint });
    if (selectionError) {
      return {
        valid: false,
        error: `Invalid validation request: ${selectionError.details.map(d => d.message).join('; ')}`
      };
    }

    // Get the schema and validate the data
    const schema = insuranceSchemas[insuranceType][endpoint];
    const { error, value } = schema.validate(data, { 
      abortEarly: false, 
      allowUnknown: false 
    });

    if (error) {
      return {
        valid: false,
        error: `Validation failed: ${error.details.map(d => d.message).join('; ')}`
      };
    }

    return {
      valid: true,
      data: value
    };

  } catch (validationError) {
    return {
      valid: false,
      error: `Validation error: ${validationError.message}`
    };
  }
}

module.exports = {
  insuranceSchemas,
  commonSchemas,
  validateInsuranceRequest
};
