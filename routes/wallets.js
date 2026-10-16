const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const walletController = require('../controllers/walletController');

// ============ USER ROUTES ============

// Get wallet
router.get('/my-wallet', authenticate, walletController.getOrCreateWallet);

// Get balance
router.get('/balance', authenticate, walletController.getBalance);

// Deposit (manual - admin approval required)
router.post('/deposit', authenticate, walletController.initiateDeposit);

// Admin deposit management
router.get('/admin/deposits/pending', authenticate, authorize('admin'), walletController.getPendingDeposits);
router.put('/admin/deposits/:transactionId/approve', authenticate, authorize('admin'), walletController.approveDeposit);
router.put('/admin/deposits/:transactionId/reject', authenticate, authorize('admin'), walletController.rejectDeposit);

// Withdrawal
router.post('/withdraw', authenticate, walletController.requestWithdrawal);

// Transactions
router.get('/transactions', authenticate, walletController.getTransactions);
router.get('/transactions/search', authenticate, walletController.searchTransactions);
router.get('/transactions/:transactionId/receipt', authenticate, walletController.generateReceipt);

// Bank details
router.put('/bank-details', authenticate, walletController.updateBankDetails);

// Security - PIN
router.post('/set-pin', authenticate, walletController.setPin);
router.post('/pin/set', authenticate, walletController.setPin);
router.post('/pin/verify', authenticate, walletController.verifyPin);

// Analytics & Reports
router.get('/analytics', authenticate, walletController.getAnalytics);
router.get('/export/csv', authenticate, walletController.exportTransactionsCSV);
router.get('/statement', authenticate, walletController.generateStatement);

// Notifications
router.get('/notifications', authenticate, walletController.getNotifications);
router.put('/notifications/read', authenticate, walletController.markNotificationsRead);

// Settings
router.put('/settings', authenticate, walletController.updateSettings);

// Transfer
router.post('/transfer', authenticate, walletController.transferToUser);

// ============ ADMIN ROUTES ============

// Get all wallets
router.get('/admin/all', authenticate, authorize('admin'), walletController.getAllWallets);

// Get pending withdrawals
router.get('/admin/withdrawals/pending', authenticate, authorize('admin'), walletController.getPendingWithdrawals);

// Process withdrawal
router.put('/admin/withdrawals/:transactionId', authenticate, authorize('admin'), walletController.processWithdrawal);

// Adjust balance
router.post('/admin/adjust/:userId', authenticate, authorize('admin'), walletController.adjustBalance);

// Freeze/Unfreeze wallet
router.put('/admin/freeze/:userId', authenticate, authorize('admin'), walletController.toggleFreezeWallet);

// Get wallet statistics
router.get('/admin/stats', authenticate, authorize('admin'), walletController.getWalletStats);

module.exports = router;
