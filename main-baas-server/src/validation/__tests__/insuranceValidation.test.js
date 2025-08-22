const { validateInsuranceRequest, insuranceSchemas, commonSchemas } = require('../insuranceValidation');

describe('Insurance Validation', () => {
  describe('Travel Insurance Validation', () => {
    const validTravelData = {
      insuranceType: 'travel',
      insuredDetail: {
        fullName: 'John Doe',
        extension: '+1',
        mobileNumber: '5550123',
        email: 'john@example.com'
      },
      travelDetail: {
        tripType: 'one-way',
        departureCountry: 'US',
        destinationCountry: 'CA',
        departureDate: '2025-12-31', // Future date
        adultCount: '2',
        childCount: '1',
        infantCount: '0'
      }
    };

    test('should validate valid travel GetAvailablePlans data', () => {
      const result = validateInsuranceRequest('travel', 'GetAvailablePlans', validTravelData);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject travel data with missing insuranceType', () => {
      const invalidData = { ...validTravelData };
      delete invalidData.insuranceType;
      const result = validateInsuranceRequest('travel', 'GetAvailablePlans', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    test('should reject travel data with invalid tripType', () => {
      const invalidData = { ...validTravelData };
      invalidData.travelDetail.tripType = 'invalid';
      const result = validateInsuranceRequest('travel', 'GetAvailablePlans', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tripType');
    });
  });

  describe('Motor Insurance Validation', () => {
    const validMotorData = {
      insuranceType: 'motor',
      insuredDetail: {
        fullName: 'Jane Smith',
        extension: '+44',
        mobileNumber: '7123456789',
        email: 'jane@example.com'
      },
      vehicleDetail: {
        vehicleType: 'car',
        licensePlate: 'ABC123',
        engineCapacity: '2000cc',
        make: 'Toyota',
        model: 'Camry',
        year: '2020'
      }
    };

    test('should validate valid motor GetAvailablePlans data', () => {
      const result = validateInsuranceRequest('motor', 'GetAvailablePlans', validMotorData);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject motor data with invalid vehicleType', () => {
      const invalidData = { ...validMotorData };
      invalidData.vehicleDetail.vehicleType = 'invalid';
      const result = validateInsuranceRequest('motor', 'GetAvailablePlans', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vehicleType');
    });
  });

  describe('Health Insurance Validation', () => {
    const validHealthData = {
      insuranceType: 'health',
      insuredDetail: {
        fullName: 'Bob Wilson',
        extension: '+61',
        mobileNumber: '412345678',
        email: 'bob@example.com'
      },
      healthDetail: {
        coverageType: 'comprehensive',
        age: 35,
        medicalHistory: 'none',
        preExistingConditions: false,
        familyHistory: 'diabetes'
      }
    };

    test('should validate valid health GetAvailablePlans data', () => {
      const result = validateInsuranceRequest('health', 'GetAvailablePlans', validHealthData);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject health data with invalid age', () => {
      const invalidData = { ...validHealthData };
      invalidData.healthDetail.age = 15; // Below minimum age
      const result = validateInsuranceRequest('health', 'GetAvailablePlans', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('age');
    });
  });

  describe('Common Validation Schemas', () => {
    test('should validate valid sessionToken', () => {
      const validData = {
        insuranceType: 'travel',
        sessionToken: 'valid-session-token',
        selectedPlan: ['plan1', 'plan2']
      };
      const result = validateInsuranceRequest('travel', 'SaveSelectedPlan', validData);
      expect(result.valid).toBe(true);
    });

    test('should reject empty selectedPlan array', () => {
      const invalidData = {
        insuranceType: 'travel',
        sessionToken: 'valid-session-token',
        selectedPlan: []
      };
      const result = validateInsuranceRequest('travel', 'SaveSelectedPlan', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('selectedPlan');
    });
  });

  describe('Payment Validation', () => {
    const validPaymentData = {
      insuranceType: 'travel',
      amount: 100.50,
      channelCode: 'direct',
      channel: 'direct',
      source: 'direct',
      sessionToken: 'valid-session-token',
      passengers: [
        {
          fullName: 'John Doe',
          dateOfBirth: '1990-01-01',
          passportNumber: '123456789',
          nationality: 'US',
          gender: 'male',
          civilId: '',
          classification: 'adult',
          isPrimary: true
        }
      ]
    };

    test('should validate valid ProceedPayment data', () => {
      const result = validateInsuranceRequest('travel', 'ProceedPayment', validPaymentData);
      expect(result.valid).toBe(true);
    });

    test('should reject negative amount', () => {
      const invalidData = { ...validPaymentData };
      invalidData.amount = -50;
      const result = validateInsuranceRequest('travel', 'ProceedPayment', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('amount');
    });

    test('should reject invalid passenger data', () => {
      const invalidData = { ...validPaymentData };
      invalidData.passengers[0].gender = 'invalid';
      const result = validateInsuranceRequest('travel', 'ProceedPayment', invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('gender');
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported insurance type', () => {
      const result = validateInsuranceRequest('invalid', 'GetAvailablePlans', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported insurance type');
    });

    test('should handle unsupported endpoint', () => {
      const result = validateInsuranceRequest('travel', 'InvalidEndpoint', {});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No validation schema found');
    });
  });
});
