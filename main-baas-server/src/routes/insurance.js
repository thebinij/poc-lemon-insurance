const express = require('express');
const router = express.Router();
const parseService = require('../services/parseService');
const { validateInsuranceRequest } = require('../validation/insuranceValidation');
const { v4: uuidv4 } = require('uuid');

const ValidationError = require('../errors/validationError');
const AuthError = require('../errors/authErrror');
const asyncHandler = require('../utils/asyncHandler');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Insurance API health check successful',
    data: {
      status: 'healthy',
      supportedTypes: ['travel', 'motor'],
      endpoints: [
        '/:insuranceType/GetAvailablePlans',
        '/:insuranceType/SaveSelectedPlan',
        '/:insuranceType/ProceedPayment',
        '/:insuranceType/ConfirmPurchase'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// Generic Insurance API Endpoints
// 1. Get Available Plans
router.post('/:insuranceType/GetAvailablePlans', asyncHandler(async (req, res) => {
  const requestId = uuidv4();
  const { insuranceType } = req.params;
  const requestData = req.body;

  // Step 1: Validate request using validation layer with path parameter
  const validation = validateInsuranceRequest(insuranceType, 'GetAvailablePlans', requestData);
  if (!validation.valid) {
    throw new ValidationError(validation.error);
  }

  // Step 2: Create new user
  const userInfo = await parseService.createUser({
    insuranceType: insuranceType,
    email: req.body.email,
    phone: req.body.phone,
    name: req.body.name,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Step 3: Log API call
  await parseService.logAPICall({
    insuranceType,
    userId: userInfo.userId,
    requestId,
    endpoint: `/${insuranceType}/GetAvailablePlans`,
    step: 'GetAvailablePlans',
    method: req.method,
    request: req.body,
    headers: req.headers,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response = {
    success: true,
    message: `Available ${insuranceType} plans retrieved`,
    data: {
      requestId,
      sessionToken: userInfo.sessionToken,
      userId: userInfo.userId,
      isNewUser: userInfo.isNewUser,
      plans: [
        { id: 'plan1', name: `Basic ${insuranceType} Plan`, premium: 100 },
        { id: 'plan2', name: `Premium ${insuranceType} Plan`, premium: 200 }
      ]
    }
  };

  await parseService.updateAPILog(requestId, insuranceType, {
    status: 'success',
    response: response,
    responseTime: 150
  });

  res.json(response);
}));

// 2. Save Selected Plan
router.post('/:insuranceType/SaveSelectedPlan', asyncHandler(async (req, res) => {
  const requestId = uuidv4();
  const { insuranceType } = req.params;
  const requestData = req.body;

  // Step 1: Validate request using validation layer with path parameter
  const validation = validateInsuranceRequest(insuranceType, 'SaveSelectedPlan', requestData);
  if (!validation.valid) {
    throw new ValidationError(validation.error);
  }

  // Step 2: Validate session
  const user = await parseService.getUserBySessionToken(req.body.sessionToken);
  if (!user) {
    throw new AuthError('Invalid or expired sessionToken');
  }

  // Step 3: Log API call
  await parseService.logAPICall({
    insuranceType,
    userId: user.id,
    requestId,
    endpoint: `/${insuranceType}/SaveSelectedPlan`,
    step: 'SaveSelectedPlan',
    method: req.method,
    request: req.body,
    headers: req.headers,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response = {
    success: true,
    message: `${insuranceType} plan saved successfully`,
    data: {
      requestId,
      savedPlanId: `saved_${requestId}`,
      planId: req.body.planId
    }
  };

  await parseService.updateAPILog(requestId, insuranceType, {
    status: 'success',
    response: response,
    responseTime: 100
  });

  res.json(response);
}));

// 3. Proceed Payment
router.post('/:insuranceType/ProceedPayment', asyncHandler(async (req, res) => {
  const requestId = uuidv4();
  const { insuranceType } = req.params;
  const requestData = req.body;

  // Step 1: Validate request using validation layer with path parameter
  const validation = validateInsuranceRequest(insuranceType, 'ProceedPayment', requestData);
  if (!validation.valid) {
    throw new ValidationError(validation.error);
  }

  // Step 2: Validate session
  const user = await parseService.getUserBySessionToken(req.body.sessionToken);
  if (!user) {
    throw new AuthError('Invalid or expired sessionToken');
  }

  // Step 3: Log API call
  await parseService.logAPICall({
    insuranceType,
    userId: user.id,
    requestId,
    endpoint: `/${insuranceType}/ProceedPayment`,
    step: 'ProceedPayment',
    method: req.method,
    request: req.body,
    headers: req.headers,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response = {
    success: true,
    message: `${insuranceType} payment processed`,
    data: {
      requestId,
      paymentId: `pay_${requestId}`,
      status: 'completed'
    }
  };

  await parseService.updateAPILog(requestId, insuranceType, {
    status: 'success',
    response: response,
    responseTime: 200
  });

  res.json(response);
}));

// 4. Confirm Purchase
router.post('/:insuranceType/ConfirmPurchase', asyncHandler(async (req, res) => {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;

    // Step 1: Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'ConfirmPurchase', requestData);
    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Step 2: Validate session
    const user = await parseService.getUserBySessionToken(req.body.sessionToken);
    if (!user) {
      throw new AuthError('Invalid or expired sessionToken');
    }

    // Step 3: Log API call
    await parseService.logAPICall({
      insuranceType,
      userId: user.id,
      requestId,
      endpoint: `/${insuranceType}/ConfirmPurchase`,
      step: 'ConfirmPurchase',
      method: req.method,
      request: req.body,
      headers: req.headers,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response = {
      success: true,
      message: `${insuranceType} purchase confirmed`,
      data: {
        requestId,
        policyId: `policy_${requestId}`,
        confirmationNumber: `conf_${requestId.substring(0, 8)}`
      }
    };

    await parseService.updateAPILog(requestId, insuranceType, {
      status: 'success',
      response: response,
      responseTime: 180
    });

    res.json(response);
}));

module.exports = router;