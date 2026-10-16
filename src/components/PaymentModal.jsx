import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import api from '../services/api';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

/**
 * Payment Form Component
 * Handles payment processing using Stripe
 */
const PaymentForm = ({ mode = 'booking', booking, deposit, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [methods, setMethods] = useState({ card: mode === 'wallet', d17: false, paymee: false });
  const [selectedMethod, setSelectedMethod] = useState('card');

  // Initialize payment
  useEffect(() => {
    const initPayment = async () => {
      try {
        const cfg = await api.get('/payments/config');
        if (cfg.data?.success) {
          const { card, d17, paymee } = cfg.data.data;
          setMethods(cfg.data.data);

          if (mode === 'booking') {
            if (paymee) setSelectedMethod('paymee');
            else if (d17) setSelectedMethod('d17');
            else if (card) setSelectedMethod('card');
          } else {
            if (card) setSelectedMethod('card');
            else if (paymee) setSelectedMethod('paymee');
            else if (d17) setSelectedMethod('d17');
          }

          if (mode === 'wallet' && !card && !paymee) {
            setError('Card deposits are unavailable and Paymee is not configured');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment');
      }
    };

    // Wallet deposits only need card; still check config to ensure Stripe is available
    if (mode === 'wallet') {
      initPayment();
      setClientSecret(deposit?.clientSecret || '');
      return;
    }

    if (booking?._id) {
      initPayment();
    }
  }, [booking, mode, deposit]);

  useEffect(() => {
    if (mode === 'wallet') return; // wallet clientSecret already provided

    const initForMethod = async () => {
      try {
        setClientSecret('');
        setError('');
        if (selectedMethod === 'card') {
          const response = await api.post('/payments/initialize', {
            bookingId: booking._id,
            method: 'card',
          });
          if (response.data.success) {
            setClientSecret(response.data.data.clientSecret);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize');
      }
    };
    if (booking?._id) initForMethod();
  }, [selectedMethod, booking, mode]);

  const handlePayment = async (e) => {
    e.preventDefault();

    if (mode === 'booking' && selectedMethod === 'paymee') {
      try {
        setLoading(true);
        const res = await api.post('/payments/initialize', {
          bookingId: booking._id,
          method: 'paymee',
        });
        if (res.data.success && res.data.data.redirectUrl) {
          window.location.href = res.data.data.redirectUrl;
          return;
        }
        setError('Paymee redirect not available');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start Paymee payment');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'booking' && selectedMethod === 'd17') {
      // request D17 init and redirect
      try {
        setLoading(true);
        const res = await api.post('/payments/initialize', {
          bookingId: booking._id,
          method: 'd17',
        });
        if (res.data.success && res.data.data.redirectUrl) {
          window.location.href = res.data.data.redirectUrl;
          return;
        }
        setError('D17 redirect not available');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start D17 payment');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (selectedMethod !== 'card') {
      setError('Unsupported payment method');
      return;
    }

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setLoading(true);
    setPaymentProcessing(true);
    setError('');

    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: booking?.user?.name || deposit?.billingName || 'Customer',
            email: booking?.user?.email || deposit?.billingEmail || '',
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (mode === 'wallet') {
        const confirmResponse = await api.post('/wallets/deposit/confirm', {
          transactionId: deposit?.transactionId,
          paymentIntentId: paymentIntent.id,
        });
        if (confirmResponse.data.success) {
          onSuccess(confirmResponse.data);
        } else {
          setError(confirmResponse.data.message || 'Deposit confirmation failed');
        }
      } else {
        // Confirm payment on backend for booking
        const confirmResponse = await api.post('/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          bookingId: booking._id,
        });

        if (confirmResponse.data.success) {
          onSuccess(confirmResponse.data.data);
        } else {
          setError(confirmResponse.data.message || 'Payment confirmation failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {mode === 'wallet' ? 'Add Funds to Wallet' : 'Payment Details'}
      </h3>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        {mode === 'wallet' ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {deposit?.amount?.toFixed(2)} {deposit?.currency || 'TND'}
              </span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                {deposit?.amount?.toFixed(2)} {deposit?.currency || 'TND'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Service:</span>
              <span className="font-medium text-gray-900 dark:text-white">{booking.service?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {booking.price} {booking.currency}
              </span>
            </div>
            {booking.platformFeeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Platform Fee:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {booking.platformFeeAmount} {booking.currency}
                </span>
              </div>
            )}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="font-bold text-lg text-blue-600">
                {(booking.price + (booking.platformFeeAmount || 0)).toFixed(3)} {booking.currency}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Method selector */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {methods.card && (
          <button
            onClick={() => setSelectedMethod('card')}
            className={`px-3 py-2 rounded-lg border ${selectedMethod === 'card' ? 'border-blue-600 text-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Card (Visa/Mastercard)
          </button>
        )}
        {methods.d17 && mode === 'booking' && (
          <button
            onClick={() => setSelectedMethod('d17')}
            className={`px-3 py-2 rounded-lg border ${selectedMethod === 'd17' ? 'border-blue-600 text-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            D17 (Tunisia)
          </button>
        )}
        {methods.paymee && mode === 'booking' && (
          <button
            onClick={() => setSelectedMethod('paymee')}
            className={`px-3 py-2 rounded-lg border ${selectedMethod === 'paymee' ? 'border-blue-600 text-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            Paymee (Tunisia cards)
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg p-4 mb-4"
        >
          {error}
        </motion.div>
      )}

      {/* Card flow */}
      <form onSubmit={handlePayment}>
        {selectedMethod === 'card' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Details
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
        )}

        {/* Payment Method Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
          {selectedMethod === 'card' && (
            <p>Your payment is securely processed through Stripe. Your card details are encrypted and never stored on our servers.</p>
          )}
          {selectedMethod === 'd17' && (
            <p>You will be redirected to D17 to complete your payment securely.</p>
          )}
          {selectedMethod === 'paymee' && (
            <p>You will be redirected to Paymee to pay with Tunisia-supported cards.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={
              loading ||
              paymentProcessing ||
              (selectedMethod === 'card' && (!stripe || !clientSecret))
            }
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {mode === 'wallet'
                  ? 'Add Funds'
                  : selectedMethod === 'card'
                  ? 'Pay Now'
                  : selectedMethod === 'd17'
                  ? 'Continue to D17'
                  : 'Continue to Paymee'}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

/**
 * Payment Modal Component
 * Wrapper with Stripe Elements provider
 */
export const PaymentModal = ({ mode = 'booking', booking, deposit, isOpen, onSuccess, onCancel }) => {
  if (!isOpen) return null;

  const hasStripe = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        {hasStripe ? (
          <Elements stripe={stripePromise}>
            <PaymentForm mode={mode} booking={booking} deposit={deposit} onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        ) : (
          <PaymentForm mode={mode} booking={booking} deposit={deposit} onSuccess={onSuccess} onCancel={onCancel} />
        )}
      </motion.div>
    </div>
  );
};

export default PaymentModal;
