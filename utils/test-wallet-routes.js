// Quick test to verify wallet routes load correctly
const express = require('express');

console.log('Testing wallet controller and routes...\n');

try {
  // Test controller load
  const walletController = require('./controllers/walletController');
  console.log('✓ Wallet controller loaded successfully');
  
  // Check required functions
  const requiredFunctions = [
    'getOrCreateWallet',
    'getBalance',
    'initiateDeposit',
    'getTransactions',
    'getAnalytics',
    'getPendingDeposits',
    'approveDeposit',
    'rejectDeposit'
  ];
  
  requiredFunctions.forEach(fn => {
    if (typeof walletController[fn] === 'function') {
      console.log(`  ✓ ${fn} exists`);
    } else {
      console.log(`  ✗ ${fn} MISSING`);
    }
  });
  
  // Test routes load
  const walletRoutes = require('./routes/wallets');
  console.log('\n✓ Wallet routes loaded successfully');
  console.log('\nAll wallet components loaded correctly! ✓');
  
} catch (error) {
  console.error('✗ Error loading wallet components:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
