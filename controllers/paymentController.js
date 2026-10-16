const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { createPaymentIntent, getPaymentIntent, createStripeCustomer, createRefund, calculateFee, isPaymentConfigured } = require('../config/payment');

/**
 * Initialize Payment for Booking
 * Create a payment intent and payment record
 */
exports.initializePayment = async (req, res) => {
  try {
    const { bookingId, method = 'card' } = req.body;
    const userId = req.user.id;

    // Stripe is unavailable in Tunisia; block card rail
    if (method === 'card') {
      return res.status(400).json({ success: false, message: 'Card payments via Stripe are unavailable in Tunisia. Use D17.' });
    }

    // Get booking
    const booking = await Booking.findById(bookingId).populate('service provider');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify user is the payer
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if payment already exists
    let payment = await Payment.findOne({ booking: bookingId });
    if (payment && payment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    // Calculate fees
    const feeData = calculateFee(booking.price, booking.platformFeePercent * 100);

    // Create or update payment record
    if (!payment) {
      payment = await Payment.create({
        booking: bookingId,
        payer: booking.user,
        payee: booking.provider,
        amount: booking.price,
        currency: booking.currency,
        platformFee: feeData.feeAmount,
        netAmount: feeData.netAmount,
        feePercent: booking.platformFeePercent * 100,
        status: 'pending',
      });
    }

    if (method === 'paymee') {
      const { isConfigured: paymeeConfigured, createPayment: createPaymeePayment } = require('../config/paymee');
      if (!paymeeConfigured()) {
        return res.status(400).json({ success: false, message: 'Paymee is not configured.' });
      }

      const returnUrl = `${process.env.BACKEND_URL}/api/payments/paymee/callback?booking=${bookingId}`;
      const paymeeResp = await createPaymeePayment({
        amount: booking.price,
        currency: booking.currency || 'TND',
        orderId: bookingId.toString(),
        returnUrl,
        note: `Booking ${bookingId}`,
      });

      if (!paymeeResp.success) {
        return res.status(500).json({ success: false, message: paymeeResp.error || 'Paymee init failed' });
      }

      payment.paymentMethod = 'paymee';
      payment.providerTxnId = paymeeResp.paymentId;
      await payment.save();

      return res.json({
        success: true,
        data: {
          payment,
          redirectUrl: paymeeResp.redirectUrl,
          providerTxnId: paymeeResp.paymentId,
          method: 'paymee',
        },
      });
    }

    if (method === 'd17') {
      const { isConfigured: isD17Configured, createTransaction } = require('../config/d17');
      if (!isD17Configured()) {
        return res.status(400).json({ success: false, message: 'D17 is not configured.' });
      }

      // Create D17 transaction (redirect-based)
      const { redirectUrl, providerTxnId } = await createTransaction({
        amount: booking.price,
        currency: booking.currency || 'TND',
        bookingId: bookingId.toString(),
        customer: { id: userId, email: req.user.email, name: req.user.name },
      });

      payment.paymentMethod = 'd17';
      payment.providerTxnId = providerTxnId;
      await payment.save();

      return res.json({
        success: true,
        data: {
          payment,
          redirectUrl,
          providerTxnId,
          method: 'd17',
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Unsupported payment method' });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error initializing payment',
    });
  }
};

/**
 * Confirm Payment
 * Verify payment intent status and update booking
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.id;

    // Stripe unavailable in Tunisia
    return res.status(400).json({ success: false, message: 'Card payments via Stripe are unavailable in Tunisia. Use D17.' });

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and booking ID are required',
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify user is payer
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Verify payment intent
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ success: false, message: 'Payment intent not found' });
    }

    // Get payment record
    let payment = await Payment.findOne({ booking: bookingId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      // Extract card details if available
      if (paymentIntent.charges.data[0]) {
        const charge = paymentIntent.charges.data[0];
        const card = charge.payment_method_details?.card;
        
        if (card) {
          payment.cardDetails = {
            brand: card.brand,
            last4: card.last4,
            expiryMonth: card.exp_month,
            expiryYear: card.exp_year,
          };
        }
        
        payment.stripeChargeId = charge.id;
      }

      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.paymentMethod = 'card';
      await payment.save();

      // Update booking status and payment info
      booking.status = 'confirmed';
      booking.payment.status = 'completed';
      booking.payment.method = 'stripe';
      booking.payment.transactionId = paymentIntentId;
      booking.payment.paidAt = new Date();
      // Update fee and provider earning on booking
      try {
        const { calculateFee } = require('../config/payment');
        const feeData = calculateFee(booking.price, booking.platformFeePercent * 100);
        booking.platformFeeAmount = feeData.feeAmount;
        booking.providerEarning = feeData.netAmount;
      } catch (_) {}
      await booking.save();

      // TODO: Send email notification to provider and customer

      return res.json({
        success: true,
        message: 'Payment completed successfully',
        data: {
          payment,
          booking,
        },
      });
    } else if (paymentIntent.status === 'processing') {
      payment.status = 'processing';
      await payment.save();

      return res.json({
        success: true,
        message: 'Payment is being processed',
        data: { payment },
      });
    } else if (paymentIntent.status === 'requires_action') {
      payment.status = 'pending';
      await payment.save();

      return res.json({
        success: true,
        message: 'Payment requires action',
        data: {
          payment,
          clientSecret: paymentIntent.client_secret,
        },
      });
    } else {
      const errorMsg = paymentIntent.last_payment_error?.message || 'Payment failed';
      payment.status = 'failed';
      payment.failureReason = errorMsg;
      payment.failureCode = paymentIntent.last_payment_error?.code;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: errorMsg,
        data: { payment },
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error confirming payment',
    });
  }
};

/**
 * D17 Callback (redirect target)
 * Accepts query params like ?status=success&ref=...&booking=...
 * Finalizes the payment based on provider verification.
 */
exports.d17Callback = async (req, res) => {
  try {
    const { status, ref: providerTxnId, booking: bookingId } = req.query;

    if (!providerTxnId || !bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid callback parameters' });
    }

    const { verifyTransaction } = require('../config/d17');
    const verification = await verifyTransaction({ providerTxnId, status });

    const payment = await Payment.findOne({ booking: bookingId, providerTxnId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (verification.success) {
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.paymentMethod = 'd17';
      await payment.save();

      booking.status = 'confirmed';
      booking.payment.status = 'completed';
      booking.payment.method = 'd17';
      booking.payment.transactionId = providerTxnId;
      booking.payment.paidAt = new Date();
      // Update fee and provider earning on booking
      try {
        const { calculateFee } = require('../config/payment');
        const feeData = calculateFee(booking.price, booking.platformFeePercent * 100);
        booking.platformFeeAmount = feeData.feeAmount;
        booking.providerEarning = feeData.netAmount;
      } catch (_) {}
      await booking.save();

      // Redirect user to frontend success page if APP_BASE_URL provided
      const appBase = process.env.APP_BASE_URL || null;
      if (appBase) {
        return res.redirect(`${appBase}/bookings?payment=success`);
      }
      return res.json({ success: true, message: 'Payment completed', data: { booking, payment } });
    }

    // Failed or cancelled
    payment.status = status === 'cancel' ? 'cancelled' : 'failed';
    payment.failureReason = verification.reason || status;
    await payment.save();

    booking.payment.status = 'failed';
    await booking.save();

    const appBase = process.env.APP_BASE_URL || null;
    if (appBase) {
      return res.redirect(`${appBase}/bookings?payment=${status}`);
    }
    return res.status(400).json({ success: false, message: 'Payment not completed', data: { status } });
  } catch (error) {
    console.error('Error in D17 callback:', error);
    return res.status(500).json({ success: false, message: 'Callback error' });
  }
};

/** Paymee callback */
exports.paymeeCallback = async (req, res) => {
  try {
    const { payment_id, booking: bookingId, status } = req.query;
    if (!payment_id || !bookingId) {
      return res.status(400).json({ success: false, message: 'Invalid callback parameters' });
    }

    const { verifyPayment } = require('../config/paymee');
    const verification = await verifyPayment(payment_id);

    const payment = await Payment.findOne({ booking: bookingId, providerTxnId: payment_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (verification.success) {
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.paymentMethod = 'paymee';
      payment.cardDetails = verification.card || undefined;
      await payment.save();

      booking.status = 'confirmed';
      booking.payment.status = 'completed';
      booking.payment.method = 'paymee';
      booking.payment.transactionId = payment_id;
      booking.payment.paidAt = new Date();
      try {
        const { calculateFee } = require('../config/payment');
        const feeData = calculateFee(booking.price, booking.platformFeePercent * 100);
        booking.platformFeeAmount = feeData.feeAmount;
        booking.providerEarning = feeData.netAmount;
      } catch (_) {}
      await booking.save();

      const appBase = process.env.APP_BASE_URL || null;
      if (appBase) {
        return res.redirect(`${appBase}/bookings?payment=success`);
      }
      return res.json({ success: true, message: 'Payment completed', data: { booking, payment } });
    }

    // Failed or cancelled
    payment.status = status === 'cancel' ? 'cancelled' : 'failed';
    payment.failureReason = verification.error || status || 'failed';
    await payment.save();

    booking.payment.status = 'failed';
    await booking.save();

    const appBase = process.env.APP_BASE_URL || null;
    if (appBase) {
      return res.redirect(`${appBase}/bookings?payment=${payment.status}`);
    }
    return res.status(400).json({ success: false, message: 'Payment not completed', data: { status: payment.status } });
  } catch (error) {
    console.error('Error in Paymee callback:', error);
    return res.status(500).json({ success: false, message: 'Callback error' });
  }
};

/** Get payment configuration (which methods are enabled) */
exports.getConfig = async (req, res) => {
  try {
    const { isConfigured: d17Enabled } = require('../config/d17');
    const { isConfigured: paymeeEnabled } = require('../config/paymee');
    res.json({
      success: true,
      data: {
        card: false,
        d17: d17Enabled(),
        paymee: paymeeEnabled(),
        publishableKey: null,
      },
    });
  } catch (error) {
    res.json({ success: true, data: { card: false, d17: false, paymee: false } });
  }
};

/**
 * Get Payment Details
 */
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId)
      .populate('booking')
      .populate('payer', 'firstName lastName email')
      .populate('payee', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify user has access (payer or payee or admin)
    if (payment.payer.toString() !== userId && payment.payee.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving payment',
    });
  }
};

/**
 * Get Booking Payments
 */
exports.getBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify user has access
    if (booking.user.toString() !== userId && booking.provider.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payment = await Payment.findOne({ booking: bookingId }).populate('payer payee', 'firstName lastName email');

    if (!payment) {
      return res.json({
        success: true,
        data: null,
        message: 'No payment found for this booking',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error getting booking payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving payment',
    });
  }
};

/**
 * Refund Payment
 * For cancellations or disputes
 */
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Only admin or payee can refund
    if (payment.payee.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to refund' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }

    // Process refund
    const refund = await createRefund(payment.stripePaymentIntentId);

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    payment.refundReason = reason || 'Admin refund';
    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.status = 'cancelled';
      booking.payment.status = 'refunded';
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment,
        refund,
      },
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing refund',
    });
  }
};

/**
 * Get Payment Methods
 * Get all saved payment methods for user
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      return res.json({
        success: true,
        data: [],
        message: 'No payment methods found',
      });
    }

    const { getPaymentMethods } = require('../config/payment');
    const methods = await getPaymentMethods(user.stripeCustomerId);

    const formattedMethods = methods.map((method) => ({
      id: method.id,
      type: method.type,
      brand: method.card?.brand,
      last4: method.card?.last4,
      expiryMonth: method.card?.exp_month,
      expiryYear: method.card?.exp_year,
    }));

    res.json({
      success: true,
      data: formattedMethods,
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving payment methods',
    });
  }
};

/**
 * Get Payment Statistics (Admin only)
 */
exports.getPaymentStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const stats = await Payment.aggregate([
      {
        $facet: {
          totalRevenue: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          platformFees: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$platformFee' } } },
          ],
          paymentsByStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          paymentsByMethod: [{ $group: { _id: '$paymentMethod', count: { $sum: 1 } } }],
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving statistics',
    });
  }
};
