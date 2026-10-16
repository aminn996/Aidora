const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getStripe, calculateFee } = require('../config/payment');
const { createTransaction: createD17Transaction, verifyTransaction: verifyD17Transaction } = require('../config/d17');
const { createPayment: createPaymeePayment, verifyPayment: verifyPaymeePayment, isConfigured: paymeeConfigured } = require('../config/paymee');
const { generateReceiptPDF, generateTransactionsCSV, generateWalletStatementPDF, calculateWalletAnalytics } = require('../utils/walletUtils');

/**
 * Get or create wallet for user
 */
exports.getOrCreateWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user.id,
        balance: 0,
        currency: 'TND'
      });
    }
    
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get wallet balance
 */
exports.getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    const availableBalance = wallet.balance - wallet.pendingWithdrawal;
    
    res.json({
      success: true,
      balance: wallet.balance,
      availableBalance,
      pendingWithdrawal: wallet.pendingWithdrawal,
      pendingDeposit: wallet.pendingDeposit,
      currency: wallet.currency,
      stats: {
        totalDeposited: wallet.totalDeposited,
        totalWithdrawn: wallet.totalWithdrawn,
        totalEarned: wallet.totalEarned
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Initialize deposit
 */
exports.initiateDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    // Get or create wallet
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id });
    }
    
    if (wallet.isFrozen) {
      return res.status(403).json({ success: false, message: 'Wallet is frozen' });
    }
    
    // Create pending deposit request for admin approval
    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      type: 'deposit',
      amount,
      currency: wallet.currency,
      method: 'manual',
      status: 'pending',
      description: 'Manual deposit request - awaiting admin approval',
      balanceBefore: wallet.balance
    });
    
    // Update pending deposit amount
    wallet.pendingDeposit = (wallet.pendingDeposit || 0) + amount;
    await wallet.save();
    
    // Notify admins
    await Notification.createNotification(req.user.id, {
      type: 'transaction',
      title: 'Deposit Request Submitted',
      message: `Your deposit request of ${amount} ${wallet.currency} has been submitted and is awaiting admin approval.`,
      priority: 'medium',
      transaction: transaction._id
    });
    
    res.json({ 
      success: true, 
      message: 'Deposit request submitted. Please wait for admin approval.',
      transactionId: transaction._id,
      transaction
    });
    
  } catch (error) {
    console.error('Initiate deposit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get pending deposit requests (for admin approval)
 */
exports.getPendingDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { type: 'deposit', status: 'pending' };
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'firstName lastName email')
        .populate('wallet')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      transactions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
    
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Approve deposit request (admin only)
 */
exports.approveDeposit = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { notes } = req.body;
    
    const transaction = await Transaction.findById(transactionId).populate('user');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'deposit' || transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid transaction state' });
    }
    
    const wallet = await Wallet.findById(transaction.wallet);
    
    // Update wallet balance
    wallet.balance += transaction.amount;
    wallet.totalDeposited += transaction.amount;
    wallet.pendingDeposit = Math.max(0, (wallet.pendingDeposit || 0) - transaction.amount);
    await wallet.save();
    
    // Update transaction
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.balanceAfter = wallet.balance;
    transaction.adminNotes = notes;
    transaction.processedBy = req.user.id;
    await transaction.save();
    
    // Notify user
    await Notification.createNotification(transaction.user._id, {
      type: 'deposit_success',
      title: 'Deposit Approved',
      message: `Your deposit of ${transaction.amount} ${transaction.currency} has been approved and credited to your wallet.`,
      priority: 'high',
      transaction: transaction._id
    });
    
    res.json({ 
      success: true, 
      message: 'Deposit approved successfully',
      transaction
    });
    
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reject deposit request (admin only)
 */
exports.rejectDeposit = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason, notes } = req.body;
    
    const transaction = await Transaction.findById(transactionId).populate('user');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'deposit' || transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invalid transaction state' });
    }
    
    const wallet = await Wallet.findById(transaction.wallet);
    
    // Update pending amount
    wallet.pendingDeposit = Math.max(0, (wallet.pendingDeposit || 0) - transaction.amount);
    await wallet.save();
    
    // Update transaction
    transaction.status = 'rejected';
    transaction.failureReason = reason || 'Rejected by admin';
    transaction.adminNotes = notes;
    transaction.processedBy = req.user.id;
    await transaction.save();
    
    // Notify user
    await Notification.createNotification(transaction.user._id, {
      type: 'system',
      title: 'Deposit Rejected',
      message: `Your deposit request of ${transaction.amount} ${transaction.currency} was rejected. Reason: ${reason || 'See admin notes'}`,
      priority: 'high',
      transaction: transaction._id
    });
    
    res.json({ 
      success: true, 
      message: 'Deposit rejected',
      transaction
    });
    
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Request withdrawal
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, withdrawalDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    if (!['bank_transfer', 'mobile_wallet', 'check'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal method' });
    }
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    if (wallet.isFrozen) {
      return res.status(403).json({ success: false, message: 'Wallet is frozen' });
    }
    
    const availableBalance = wallet.balance - wallet.pendingWithdrawal;
    if (availableBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance',
        availableBalance 
      });
    }
    
    // Validate withdrawal details
    if (method === 'bank_transfer') {
      if (!withdrawalDetails?.accountNumber || !withdrawalDetails?.bankName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bank account details required' 
        });
      }
    }
    
    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      type: 'withdrawal',
      amount: -amount, // Negative for withdrawal
      currency: wallet.currency,
      method: 'manual', // Withdrawals are processed manually by admin
      withdrawalMethod: method,
      withdrawalDetails,
      status: 'pending',
      description: `Withdrawal request via ${method}`,
      balanceBefore: wallet.balance
    });
    
    // Update pending withdrawal
    wallet.pendingWithdrawal += amount;
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted. Will be processed within 1-3 business days.',
      transaction,
      availableBalance: wallet.balance - wallet.pendingWithdrawal
    });
    
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get transaction history
 */
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    const filter = { wallet: wallet._id };
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('booking', 'service status')
      .populate('processedBy', 'name email');
    
    const count = await Transaction.countDocuments(filter);
    
    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTransactions: count
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update bank details
 */
exports.updateBankDetails = async (req, res) => {
  try {
    const { accountName, accountNumber, bankName, iban, swift } = req.body;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    wallet.bankDetails = {
      accountName,
      accountNumber,
      bankName,
      iban,
      swift
    };
    
    await wallet.save();
    
    res.json({ success: true, message: 'Bank details updated', bankDetails: wallet.bankDetails });
    
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============ ADMIN FUNCTIONS ============

/**
 * Get all wallets (Admin)
 */
exports.getAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    let userFilter = {};
    if (search) {
      const users = await User.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }).select('_id');
      userFilter.user = { $in: users.map(u => u._id) };
    }
    
    if (status) {
      if (status === 'frozen') {
        userFilter.isFrozen = true;
      } else if (status === 'active') {
        userFilter.isFrozen = false;
        userFilter.isActive = true;
      }
    }
    
    const wallets = await Wallet.find(userFilter)
      .populate('user', 'name email role')
      .sort({ balance: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Wallet.countDocuments(userFilter);
    
    // Calculate stats
    const stats = await Wallet.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalDeposited: { $sum: '$totalDeposited' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          totalEarned: { $sum: '$totalEarned' },
          totalPendingWithdrawal: { $sum: '$pendingWithdrawal' }
        }
      }
    ]);
    
    res.json({
      success: true,
      wallets,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalWallets: count,
      stats: stats[0] || {}
    });
    
  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get pending withdrawals (Admin)
 */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await Transaction.find({
      type: 'withdrawal',
      status: 'pending'
    })
      .populate('user', 'name email phone')
      .populate('wallet')
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Transaction.countDocuments({
      type: 'withdrawal',
      status: 'pending'
    });
    
    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPending: count
    });
    
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Process withdrawal (Admin)
 */
exports.processWithdrawal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, adminNotes } = req.body; // status: 'completed' or 'failed'
    
    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: 'Not a withdrawal transaction' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }
    
    const wallet = await Wallet.findById(transaction.wallet);
    const withdrawalAmount = Math.abs(transaction.amount);
    
    if (status === 'completed') {
      // Deduct from balance
      wallet.balance -= withdrawalAmount;
      wallet.totalWithdrawn += withdrawalAmount;
      wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - withdrawalAmount);
      
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.balanceAfter = wallet.balance;
      
    } else if (status === 'failed') {
      // Release pending amount
      wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - withdrawalAmount);
      
      transaction.status = 'failed';
      transaction.failureReason = adminNotes || 'Rejected by admin';
    }
    
    transaction.processedBy = req.user.id;
    transaction.processedAt = new Date();
    transaction.adminNotes = adminNotes;
    
    await wallet.save();
    await transaction.save();
    
    // TODO: Send notification to user
    
    res.json({
      success: true,
      message: `Withdrawal ${status}`,
      transaction
    });
    
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Adjust wallet balance (Admin)
 */
exports.adjustBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    if (!amount || amount === 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // Create adjustment transaction
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: 'adjustment',
      amount,
      currency: wallet.currency,
      method: 'manual',
      status: 'completed',
      description: reason || 'Balance adjustment by admin',
      adminNotes: reason,
      processedBy: req.user.id,
      processedAt: new Date(),
      completedAt: new Date(),
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + amount
    });
    
    wallet.balance += amount;
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Balance adjusted',
      wallet,
      transaction
    });
    
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Freeze/Unfreeze wallet (Admin)
 */
exports.toggleFreezeWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    wallet.isFrozen = !wallet.isFrozen;
    wallet.frozenReason = wallet.isFrozen ? reason : null;
    await wallet.save();
    
    res.json({
      success: true,
      message: wallet.isFrozen ? 'Wallet frozen' : 'Wallet unfrozen',
      wallet
    });
    
  } catch (error) {
    console.error('Toggle freeze wallet error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get wallet statistics (Admin)
 */
exports.getWalletStats = async (req, res) => {
  try {
    const stats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalWallets: { $sum: 1 },
          activeWallets: {
            $sum: { $cond: [{ $and: ['$isActive', { $not: '$isFrozen' }] }, 1, 0] }
          },
          frozenWallets: { $sum: { $cond: ['$isFrozen', 1, 0] } },
          totalBalance: { $sum: '$balance' },
          totalDeposited: { $sum: '$totalDeposited' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          totalEarned: { $sum: '$totalEarned' },
          totalPendingWithdrawal: { $sum: '$pendingWithdrawal' },
          totalPendingDeposit: { $sum: '$pendingDeposit' }
        }
      }
    ]);
    
    const pendingWithdrawalsCount = await Transaction.countDocuments({
      type: 'withdrawal',
      status: 'pending'
    });
    
    const pendingDepositsCount = await Transaction.countDocuments({
      type: 'deposit',
      status: { $in: ['pending', 'processing'] }
    });
    
    res.json({
      success: true,
      stats: {
        ...stats[0],
        pendingWithdrawalsCount,
        pendingDepositsCount
      }
    });
    
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Set/Update wallet PIN
 */
exports.setPin = async (req, res) => {
  try {
    const { pin, currentPin } = req.body;
    
    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be 4-6 digits' });
    }
    
    const wallet = await Wallet.findOne({ user: req.user.id }).select('+pin');
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // If PIN already exists, verify current PIN
    if (wallet.pinEnabled && currentPin) {
      const isValid = await wallet.verifyPin(currentPin);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid current PIN' });
      }
    }
    
    wallet.pin = pin;
    wallet.pinEnabled = true;
    wallet.failedPinAttempts = 0;
    await wallet.save();
    
    // Create notification
    await Notification.createNotification(req.user.id, {
      type: 'security_alert',
      title: 'PIN Updated',
      message: 'Your wallet PIN has been updated successfully',
      priority: 'medium'
    });
    
    res.json({ success: true, message: 'PIN set successfully' });
  } catch (error) {
    console.error('Set PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify wallet PIN
 */
exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    
    const wallet = await Wallet.findOne({ user: req.user.id }).select('+pin');
    if (!wallet || !wallet.pinEnabled) {
      return res.status(400).json({ success: false, message: 'PIN not set' });
    }
    
    // Check for too many failed attempts
    if (wallet.failedPinAttempts >= 3) {
      const timeSinceLastAttempt = Date.now() - new Date(wallet.lastPinAttempt).getTime();
      if (timeSinceLastAttempt < 15 * 60 * 1000) { // 15 minutes
        return res.status(429).json({ 
          success: false, 
          message: 'Too many failed attempts. Try again later.' 
        });
      } else {
        wallet.failedPinAttempts = 0;
      }
    }
    
    const isValid = await wallet.verifyPin(pin);
    
    if (!isValid) {
      wallet.failedPinAttempts += 1;
      wallet.lastPinAttempt = new Date();
      await wallet.save();
      
      return res.status(401).json({ 
        success: false, 
        message: `Invalid PIN. ${3 - wallet.failedPinAttempts} attempts remaining` 
      });
    }
    
    wallet.failedPinAttempts = 0;
    await wallet.save();
    
    res.json({ success: true, message: 'PIN verified' });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get wallet analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    const query = { user: req.user.id, status: 'completed' };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    const analytics = calculateWalletAnalytics(transactions);
    
    res.json({
      success: true,
      analytics: {
        ...analytics,
        currentBalance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalDeposited: wallet.totalDeposited,
        totalWithdrawn: wallet.totalWithdrawn,
        monthlySpending: Object.fromEntries(wallet.analytics.monthlySpending || []),
        categorySpending: Object.fromEntries(wallet.analytics.categorySpending || [])
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Export transactions as CSV
 */
exports.exportTransactionsCSV = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = { user: req.user.id };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    const csv = generateTransactionsCSV(transactions);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Generate wallet statement PDF
 */
exports.generateStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    const user = await User.findById(req.user.id);
    
    if (!wallet || !user) {
      return res.status(404).json({ success: false, message: 'Wallet or user not found' });
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const transactions = await Transaction.find({
      user: req.user.id,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });
    
    const statementUrl = await generateWalletStatementPDF(wallet, user, transactions, start, end);
    
    res.json({ success: true, url: statementUrl });
  } catch (error) {
    console.error('Generate statement error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Generate transaction receipt
 */
exports.generateReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });
    
    const receiptUrl = await generateReceiptPDF(transaction, user, wallet);
    
    transaction.receiptUrl = receiptUrl;
    transaction.receiptGenerated = true;
    await transaction.save();
    
    res.json({ success: true, url: receiptUrl });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Search transactions
 */
exports.searchTransactions = async (req, res) => {
  try {
    const { q, type, status, method, category, minAmount, maxAmount, startDate, endDate, page = 1 } = req.query;
    const limit = 20;
    
    const query = { user: req.user.id };
    
    // Build search query
    if (q) {
      query.$or = [
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    if (type && type !== 'all') query.type = type;
    if (status) query.status = status;
    if (method) query.method = method;
    if (category) query.category = category;
    
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    
    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Mark notifications as read
 */
exports.markNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ success: false, message: 'Invalid notification IDs' });
    }
    
    await Notification.markAsRead(req.user.id, notificationIds);
    
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update wallet settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { notifications, limits, autoReload, metadata } = req.body;
    
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    if (notifications) {
      wallet.notifications = { ...wallet.notifications, ...notifications };
    }
    
    if (limits) {
      wallet.limits = { ...wallet.limits, ...limits };
    }
    
    if (autoReload) {
      wallet.autoReload = { ...wallet.autoReload, ...autoReload };
    }
    
    if (metadata) {
      wallet.metadata = { ...wallet.metadata, ...metadata };
    }
    
    await wallet.save();
    
    res.json({ success: true, message: 'Settings updated', wallet });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Transfer money to another user
 */
exports.transferToUser = async (req, res) => {
  try {
    const { recipientEmail, amount, pin, note } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const senderWallet = await Wallet.findOne({ user: req.user.id }).select('+pin');
    if (!senderWallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    
    // Verify PIN if enabled
    if (senderWallet.pinEnabled) {
      if (!pin) {
        return res.status(400).json({ success: false, message: 'PIN required' });
      }
      const isValid = await senderWallet.verifyPin(pin);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid PIN' });
      }
    }
    
    // Check balance
    if (senderWallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    
    // Find recipient
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    
    if (recipient._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
    }
    
    let recipientWallet = await Wallet.findOne({ user: recipient._id });
    if (!recipientWallet) {
      recipientWallet = await Wallet.create({ user: recipient._id });
    }
    
    // Perform transfer
    senderWallet.balance -= amount;
    senderWallet.totalSpent += amount;
    recipientWallet.balance += amount;
    
    await senderWallet.save();
    await recipientWallet.save();
    
    // Create transactions
    await Transaction.create([
      {
        user: req.user.id,
        wallet: senderWallet._id,
        type: 'transfer',
        amount: -amount,
        currency: senderWallet.currency,
        status: 'completed',
        method: 'wallet',
        category: 'transfer',
        description: `Transfer to ${recipient.firstName}`,
        notes: note,
        transferTo: recipient._id,
        balanceBefore: senderWallet.balance + amount,
        balanceAfter: senderWallet.balance,
        completedAt: new Date()
      },
      {
        user: recipient._id,
        wallet: recipientWallet._id,
        type: 'transfer',
        amount: amount,
        currency: recipientWallet.currency,
        status: 'completed',
        method: 'wallet',
        category: 'transfer',
        description: `Transfer from ${req.user.firstName}`,
        notes: note,
        transferFrom: req.user.id,
        balanceBefore: recipientWallet.balance - amount,
        balanceAfter: recipientWallet.balance,
        completedAt: new Date()
      }
    ]);
    
    // Create notifications
    await Notification.createNotification(recipient._id, {
      type: 'transaction',
      title: 'Money Received',
      message: `You received ${amount} from ${req.user.firstName}`,
      priority: 'medium'
    });
    
    res.json({ success: true, message: 'Transfer successful' });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
