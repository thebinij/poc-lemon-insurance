import express from 'express';
import parseService from '../services/parseService.js';
import { validateInsuranceRequest } from '../validation/insuranceValidation.js';
import { publishToSQS } from "../services/sqsService.js";
import { authMiddleware } from '../middlewares/auth.js';
import { v4 as uuidv4 } from 'uuid';
import ValidationError from '../errors/validationError.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

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
    email: req.body?.insuredDetail.email,
    phone: req.body?.insuredDetail.phone,
    name: req.body?.insuredDetail.fullName,
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

  // Step 4: Publish event to SQS
  await publishToSQS({
    eventType: 'GetAvailablePlans',
    insuranceType,
    requestId,
    userInfo: {
      userId: userInfo.userId,
      sessionToken: userInfo.sessionToken,
      isNewUser: userInfo.isNewUser,
    },
    timestamp: new Date().toISOString(),
    payload: req.body
  });

 res.json({
    success: true,
    message: `Available ${insuranceType} plans queued for processing`,
    data: {
      requestId,
      sessionToken: userInfo.sessionToken,
      userId: userInfo.userId,
      isNewUser: userInfo.isNewUser
    }
  });
}));

// 2. Save Selected Plan
router.post('/:insuranceType/SaveSelectedPlan', authMiddleware, asyncHandler(async (req, res) => {
  const requestId = uuidv4();
  const { insuranceType } = req.params;
  const requestData = req.body;

  // Step 1: Validate request using validation layer with path parameter
  const validation = validateInsuranceRequest(insuranceType, 'SaveSelectedPlan', requestData);
  if (!validation.valid) {
    throw new ValidationError(validation.error);
  }

  // Step 2: User is already validated by auth middleware
  const user = req.user;

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
router.post('/:insuranceType/ProceedPayment', authMiddleware, asyncHandler(async (req, res) => {
  const requestId = uuidv4();
  const { insuranceType } = req.params;
  const requestData = req.body;

  // Step 1: Validate request using validation layer with path parameter
  const validation = validateInsuranceRequest(insuranceType, 'ProceedPayment', requestData);
  if (!validation.valid) {
    throw new ValidationError(validation.error);
  }

  // Step 2: User is already validated by auth middleware
  const user = req.user;

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
router.post('/:insuranceType/ConfirmPurchase', authMiddleware, asyncHandler(async (req, res) => {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;

    // Step 1: Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'ConfirmPurchase', requestData);
    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Step 2: User is already validated by auth middleware
    const user = req.user;

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

// 5. Check Status
router.get('/:insuranceType/CheckStatus', authMiddleware, asyncHandler(async (req, res) => {
  const { insuranceType } = req.params;
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ success: false, message: 'requestId is required' });
  }

  // User is already validated by auth middleware
  const user = req.user;

  // Fetch log entry
  const logEntry = await parseService.getAPILogByRequestId(requestId, insuranceType);

  if (!logEntry) {
    return res.status(404).json({ success: false, message: 'Request log not found' });
  }

  res.json({
    success: true,
    data: {
      requestId: logEntry.get('requestId'),
      status: logEntry.get('status'),
      step: logEntry.get('step'),
      response: logEntry.get('response') || {},
      timestamp: logEntry.get('timestamp')
    }
  });
}));


export default router;