import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Debug endpoint to validate VTU request
router.post('/debug/validate-airtime', authenticate, (req, res) => {
  const { network, phoneNumber, amount } = req.body;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate network
  if (!network) {
    errors.push('Network is required');
  } else if (!['MTN', 'GLO', 'AIRTEL', '9MOBILE'].includes(network.toUpperCase())) {
    errors.push(`Invalid network: ${network}. Must be MTN, GLO, AIRTEL, or 9MOBILE`);
  }
  
  // Validate phone number
  if (!phoneNumber) {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^0[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      errors.push(`Invalid phone format: ${phoneNumber}. Must be 11 digits starting with 070, 080, 081, 090, 091`);
    }
    
    // Check if it's a test number
    if (phoneNumber === '08012345678' || phoneNumber === '08034567890') {
      warnings.push('This appears to be a test number. Maskawa API may reject it with 500 error.');
    }
  }
  
  // Validate amount
  if (!amount) {
    errors.push('Amount is required');
  } else {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      errors.push(`Invalid amount: ${amount}. Must be a number`);
    } else if (numAmount < 100) {
      errors.push(`Amount too low: ₦${numAmount}. Minimum is ₦100`);
    } else if (numAmount > 50000) {
      warnings.push(`Large amount: ₦${numAmount}. Consider testing with smaller amount first`);
    }
  }
  
  // Network ID mapping
  const networkMap: { [key: string]: number } = {
    'MTN': 1,
    'GLO': 2,
    '9MOBILE': 3,
    'AIRTEL': 4,
  };
  
  const networkId = networkMap[network?.toUpperCase()];
  
  // Build the payload that will be sent to Maskawa
  const maskawaPayload = {
    network: networkId,
    mobile_number: phoneNumber,
    Ported_number: true,
    amount: parseFloat(amount),
  };
  
  res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    input: {
      network,
      phoneNumber,
      amount,
    },
    maskawaPayload,
    message: errors.length === 0 
      ? 'Request is valid and ready to send to Maskawa API' 
      : 'Request has validation errors',
  });
});

export default router;
