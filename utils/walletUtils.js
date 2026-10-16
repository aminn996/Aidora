const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate transaction receipt PDF
 */
exports.generateReceiptPDF = async (transaction, user, wallet) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure receipts directory exists
      const receiptsDir = path.join(__dirname, '../../receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const filename = `receipt-${transaction._id}.pdf`;
      const filepath = path.join(receiptsDir, filename);
      
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('AIDORA', { align: 'center' });
      doc.fontSize(10).text('Transaction Receipt', { align: 'center' });
      doc.moveDown();
      
      // Transaction details
      doc.fontSize(12).text('Receipt Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Transaction ID: ${transaction._id}`);
      doc.text(`Date: ${new Date(transaction.createdAt).toLocaleString()}`);
      doc.text(`Type: ${transaction.type.toUpperCase()}`);
      doc.text(`Status: ${transaction.status.toUpperCase()}`);
      doc.moveDown();

      // Amount
      doc.fontSize(12).text('Amount Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(14);
      doc.text(`Amount: ${transaction.amount.toFixed(2)} ${transaction.currency}`, { bold: true });
      doc.fontSize(10);
      doc.text(`Method: ${transaction.method}`);
      if (transaction.description) {
        doc.text(`Description: ${transaction.description}`);
      }
      doc.moveDown();

      // User details
      doc.fontSize(12).text('User Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Name: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown();

      // Balance info
      if (transaction.balanceBefore !== undefined && transaction.balanceAfter !== undefined) {
        doc.fontSize(12).text('Balance Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Balance Before: ${transaction.balanceBefore.toFixed(2)} ${transaction.currency}`);
        doc.text(`Balance After: ${transaction.balanceAfter.toFixed(2)} ${transaction.currency}`);
        doc.moveDown();
      }

      // Footer
      doc.fontSize(8).text(
        'This is a computer-generated receipt. For any queries, please contact support.',
        { align: 'center', color: 'gray' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(`/receipts/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate CSV export of transactions
 */
exports.generateTransactionsCSV = (transactions) => {
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Amount',
    'Currency',
    'Method',
    'Status',
    'Category',
    'Description',
    'Balance Before',
    'Balance After'
  ];

  const rows = transactions.map(txn => [
    txn._id.toString(),
    new Date(txn.createdAt).toISOString(),
    txn.type,
    txn.amount,
    txn.currency,
    txn.method,
    txn.status,
    txn.category || '',
    txn.description || '',
    txn.balanceBefore || '',
    txn.balanceAfter || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Generate wallet statement PDF
 */
exports.generateWalletStatementPDF = async (wallet, user, transactions, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      const statementsDir = path.join(__dirname, '../../statements');
      if (!fs.existsSync(statementsDir)) {
        fs.mkdirSync(statementsDir, { recursive: true });
      }

      const filename = `statement-${wallet._id}-${Date.now()}.pdf`;
      const filepath = path.join(statementsDir, filename);
      
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('AIDORA WALLET STATEMENT', { align: 'center' });
      doc.moveDown();
      
      // Period
      doc.fontSize(10);
      doc.text(`Statement Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown();

      // User info
      doc.fontSize(12).text('Account Holder', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Name: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.text(`Wallet ID: ${wallet._id}`);
      doc.moveDown();

      // Summary
      doc.fontSize(12).text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Current Balance: ${wallet.balance.toFixed(2)} ${wallet.currency}`);
      doc.text(`Total Deposited: ${wallet.totalDeposited.toFixed(2)} ${wallet.currency}`);
      doc.text(`Total Withdrawn: ${wallet.totalWithdrawn.toFixed(2)} ${wallet.currency}`);
      doc.text(`Total Transactions: ${transactions.length}`);
      doc.moveDown();

      // Transactions table
      doc.fontSize(12).text('Transaction History', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(8);

      transactions.forEach((txn, index) => {
        if (index > 0 && index % 20 === 0) {
          doc.addPage();
        }
        
        doc.text(
          `${new Date(txn.createdAt).toLocaleDateString()} | ${txn.type} | ${txn.amount.toFixed(2)} ${txn.currency} | ${txn.status}`,
          { width: 500 }
        );
      });

      doc.end();

      stream.on('finish', () => {
        resolve(`/statements/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Calculate wallet analytics
 */
exports.calculateWalletAnalytics = (transactions) => {
  const analytics = {
    totalTransactions: transactions.length,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalPayments: 0,
    averageTransaction: 0,
    categoryBreakdown: {},
    monthlyTrend: {},
    methodBreakdown: {},
  };

  transactions.forEach(txn => {
    // Type breakdown
    if (txn.type === 'deposit') analytics.totalDeposits += txn.amount;
    if (txn.type === 'withdrawal') analytics.totalWithdrawals += txn.amount;
    if (txn.type === 'payment') analytics.totalPayments += txn.amount;

    // Category breakdown
    const category = txn.category || 'other';
    analytics.categoryBreakdown[category] = (analytics.categoryBreakdown[category] || 0) + txn.amount;

    // Method breakdown
    analytics.methodBreakdown[txn.method] = (analytics.methodBreakdown[txn.method] || 0) + 1;

    // Monthly trend
    const month = new Date(txn.createdAt).toISOString().slice(0, 7);
    if (!analytics.monthlyTrend[month]) {
      analytics.monthlyTrend[month] = { deposits: 0, withdrawals: 0, payments: 0 };
    }
    analytics.monthlyTrend[month][txn.type + 's'] = 
      (analytics.monthlyTrend[month][txn.type + 's'] || 0) + txn.amount;
  });

  // Calculate average
  if (transactions.length > 0) {
    const totalAmount = transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    analytics.averageTransaction = totalAmount / transactions.length;
  }

  return analytics;
};
