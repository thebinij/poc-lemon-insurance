const express = require('express');
const router = express.Router();
const parseService = require('../services/parseService');
const sqsService = require('../services/sqsService');
const { validateInsuranceRequest } = require('../validation/insuranceValidation');
const { v4: uuidv4 } = require('uuid');

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Insurance API health check successful',
    data: {
      status: 'healthy', 
      supportedTypes: ['travel', 'motor', 'health'],
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

// Generic Insurance API Endpoints with Path Parameters

// 1. Get Available Plans (Generic)
router.post('/:insuranceType/GetAvailablePlans', async (req, res) => {
  try {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;
    
    // Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'GetAvailablePlans', requestData);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.error,
        data: null
      });
    }

    // Create event record in Parse
    const eventData = {
      eventType: 'GET_AVAILABLE_PLANS',
      requestId,
      insuranceType,
      data: validation.data
    };

    const event = await parseService.createInsuranceEvent(eventData);

    // Send to SQS for Lambda processing
    const message = {
      eventId: event.id,
      eventType: 'GET_AVAILABLE_PLANS',
      requestId,
      insuranceType,
      data: validation.data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await sqsService.publishToSQS(message);
    
    // Generate session token for this request (only in first step)
    const sessionToken = uuidv4();
    
    res.status(202).json({
      success: true,
      message: `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} available plans request received and queued for processing`,
      data: {
        requestId,
        eventId: event.id,
        insuranceType,
        status: 'pending',
        sessionToken,
        requestData: validation.data
      }
    });
    
  } catch (error) {
    console.error('Error queuing available plans request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to queue available plans request',
      data: null
    });
  }
});

// 2. Save Selected Plan (Generic)
router.post('/:insuranceType/SaveSelectedPlan', async (req, res) => {
  try {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;
    
    // Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'SaveSelectedPlan', requestData);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.error,
        data: null
      });
    }

    // Create event record in Parse
    const eventData = {
      eventType: 'SAVE_SELECTED_PLAN',
      requestId,
      insuranceType,
      data: validation.data
    };

    const event = await parseService.createInsuranceEvent(eventData);

    // Send to SQS for Lambda processing
    const message = {
      eventId: event.id,
      eventType: 'SAVE_SELECTED_PLAN',
      requestId,
      insuranceType,
      data: validation.data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await sqsService.publishToSQS(message);
    
    res.status(202).json({
      success: true,
      message: `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} plan selection saved and queued for processing`,
      data: {
        requestId,
        eventId: event.id,
        insuranceType,
        status: 'pending',
        requestData: validation.data
      }
    });
    
  } catch (error) {
    console.error('Error queuing plan selection:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to queue plan selection',
      data: null
    });
  }
});

// 3. Proceed Payment (Generic)
router.post('/:insuranceType/ProceedPayment', async (req, res) => {
  try {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;
    
    // Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'ProceedPayment', requestData);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.error,
        data: null
      });
    }

    // Create event record in Parse
    const eventData = {
      eventType: 'PROCEED_PAYMENT',
      requestId,
      insuranceType,
      data: validation.data
    };

    const event = await parseService.createInsuranceEvent(eventData);

    // Send to SQS for Lambda processing
    const message = {
      eventId: event.id,
      eventType: 'PROCEED_PAYMENT',
      requestId,
      insuranceType,
      data: validation.data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await sqsService.publishToSQS(message);
    
    res.status(202).json({
      success: true,
      message: `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} payment request received and queued for processing`,
      data: {
        requestId,
        eventId: event.id,
        insuranceType,
        status: 'pending',
        requestData: validation.data
      }
    });
    
  } catch (error) {
    console.error('Error queuing payment request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to queue payment request',
      data: null
    });
  }
});

// 4. Confirm Purchase (Generic)
router.post('/:insuranceType/ConfirmPurchase', async (req, res) => {
  try {
    const requestId = uuidv4();
    const { insuranceType } = req.params;
    const requestData = req.body;
    
    // Validate request using validation layer with path parameter
    const validation = validateInsuranceRequest(insuranceType, 'ConfirmPurchase', requestData);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.error,
        data: null
      });
    }

    // Create event record in Parse
    const eventData = {
      eventType: 'CONFIRM_PURCHASE',
      requestId,
      insuranceType,
      data: validation.data
    };

    const event = await parseService.createInsuranceEvent(eventData);

    // Send to SQS for Lambda processing
    const message = {
      eventId: event.id,
      eventType: 'CONFIRM_PURCHASE',
      requestId,
      insuranceType,
      data: validation.data,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await sqsService.publishToSQS(message);
    
    res.status(202).json({
      success: true,
      message: `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)} purchase confirmation received and queued for processing`,
      data: {
        requestId,
        eventId: event.id,
        insuranceType,
        status: 'pending',
        requestData: validation.data
      }
    });
    
  } catch (error) {
    console.error('Error queuing purchase confirmation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to queue purchase confirmation',
      data: null
    });
  }
});

// Legacy endpoints for backward compatibility (redirect to generic endpoints)
router.post('/policies', async (req, res) => {
  // Redirect to GetAvailablePlans with insurance type from body
  const insuranceType = req.body.insuranceType || 'general';
  req.body.eventType = 'CREATE_POLICY';
  return router.handle(req, res, () => {
    req.url = `/${insuranceType}/GetAvailablePlans`;
    req.params.insuranceType = insuranceType;
    router.handle(req, res);
  });
});

router.post('/claims', async (req, res) => {
  // Redirect to ProceedPayment for claim processing with insurance type from body
  const insuranceType = req.body.insuranceType || 'general';
  req.body.eventType = 'CREATE_CLAIM';
  return router.handle(req, res, () => {
    req.url = `/${insuranceType}/ProceedPayment`;
    req.params.insuranceType = insuranceType;
    router.handle(req, res);
  });
});

module.exports = router;
