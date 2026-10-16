// D17 Payment Adapter (Tunisia)
// This adapter scaffolds a redirect-based D17 payment flow.
// It is optional and only enabled when env vars are provided.

const crypto = require('crypto');

const isConfigured = () => {
  return (
    !!process.env.D17_API_KEY &&
    !!process.env.D17_MERCHANT_CODE &&
    !!process.env.D17_BASE_URL // e.g. https://d17.tn/pay or sandbox URL
  );
};

// Return URLs helper
const getReturnUrls = (baseAppUrl) => {
  const appBase = baseAppUrl || process.env.APP_BASE_URL || 'http://localhost:5173';
  const apiBase = process.env.API_BASE_URL || 'http://localhost:5000';
  return {
    successUrl: `${apiBase}/api/payments/d17/callback?status=success`,
    cancelUrl: `${apiBase}/api/payments/d17/callback?status=cancel`,
    failureUrl: `${apiBase}/api/payments/d17/callback?status=failure`,
  };
};

/**
 * Create a D17 transaction and return a redirect URL
 * Note: Real D17 integration requires their documented fields and signature.
 * This scaffolding builds a deterministic redirect URL with metadata we can parse on callback.
 */
const createTransaction = async ({
  amount,
  currency = 'TND',
  bookingId,
  customer,
}) => {
  if (!isConfigured()) throw new Error('D17 is not configured');

  // Build a provider reference we can track
  const providerTxnId = `d17_${bookingId}_${Date.now()}`;

  const { successUrl, cancelUrl, failureUrl } = getReturnUrls();

  // In a real integration, you would call D17 API to create a payment session
  // and get a redirect URL. Here we synthesize a redirect URL with query params
  // that our callback can use to complete the flow.
  const base = process.env.D17_BASE_URL.replace(/\/$/, '');
  const redirectUrl = `${base}/pay?amount=${encodeURIComponent(
    amount.toFixed(3)
  )}&currency=${encodeURIComponent(currency)}&ref=${encodeURIComponent(
    providerTxnId
  )}&booking=${encodeURIComponent(bookingId)}&return_success=${encodeURIComponent(
    successUrl
  )}&return_cancel=${encodeURIComponent(cancelUrl)}&return_failure=${encodeURIComponent(
    failureUrl
  )}`;

  return { redirectUrl, providerTxnId };
};

/**
 * Verify D17 transaction (placeholder)
 * In a real flow, this would validate signatures or query the D17 API.
 */
const verifyTransaction = async ({ providerTxnId, status }) => {
  if (!isConfigured()) throw new Error('D17 is not configured');

  // Placeholder verification logic
  // Accept success, mark others as failed/cancelled
  if (status === 'success') {
    return { success: true };
  }
  if (status === 'cancel') {
    return { success: false, reason: 'cancelled' };
  }
  return { success: false, reason: 'failed' };
};

module.exports = {
  isConfigured,
  createTransaction,
  verifyTransaction,
  getReturnUrls,
};
