import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';

const Wallet = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [transferModal, setTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ recipientEmail: '', amount: '', note: '' });
  const [message, setMessage] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWalletData();
  }, [isAuthenticated, navigate]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transRes, analyticsRes] = await Promise.all([
        api.get('/wallets/balance'),
        api.get('/wallets/transactions?limit=10'),
        api.get('/wallets/analytics')
      ]);
      setWallet(walletRes.data.data);
      setTransactions(transRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setMessage(error.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }
    
    try {
      const res = await api.post('/wallets/deposit', {
        amount: parseFloat(depositAmount)
      });
      setMessage('Deposit request submitted. Please wait for admin approval.');
      setShowDepositModal(false);
      setDepositAmount('');
      fetchWalletData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Deposit request failed');
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setPinError('PIN must be 4-6 digits');
      return;
    }
    try {
      await api.post('/wallets/set-pin', { pin: newPin });
      setMessage('PIN set successfully');
      setPinModalOpen(false);
      setNewPin('');
      setPinError('');
    } catch (error) {
      setPinError(error.response?.data?.message || 'Failed to set PIN');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wallets/transfer', {
        recipientEmail: transferData.recipientEmail,
        amount: parseFloat(transferData.amount),
        note: transferData.note
      });
      setMessage('Transfer sent successfully');
      setTransferModal(false);
      setTransferData({ recipientEmail: '', amount: '', note: '' });
      fetchWalletData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Transfer failed');
    }
  };

  const handleWithdraw = async (amount) => {
    try {
      await api.post('/wallets/withdraw', {
        amount: parseFloat(amount)
      });
      setMessage('Withdrawal request submitted');
      fetchWalletData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Withdrawal failed');
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {message}
          </motion.div>
        )}

        {/* Wallet Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Wallet</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Balance Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white shadow-lg"
            >
              <p className="text-blue-100 mb-2">Available Balance</p>
              <h2 className="text-4xl font-bold mb-4">
                {wallet?.currency} {wallet?.balance?.toFixed(2) || '0.00'}
              </h2>
              <p className="text-blue-100">
                Pending: {wallet?.currency} {wallet?.pendingAmount?.toFixed(2) || '0.00'}
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDepositModal(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
              >
                💵 Request Deposit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTransferModal(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
              >
                ➤ Send to User
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWithdraw(wallet?.balance || 0)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
              >
                🏧 Withdraw
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPinModalOpen(true)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition"
              >
                🔐 Set PIN
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {['overview', 'transactions', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((trans) => (
                    <motion.div
                      key={trans._id}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{trans.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(trans.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${trans.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trans.amount > 0 ? '+' : ''}{trans.currency} {trans.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{trans.status}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">All Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">No transactions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-right py-3 px-4">Amount</th>
                        <th className="text-center py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trans) => (
                        <tr key={trans._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">
                            {new Date(trans.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm">{trans.description}</td>
                          <td className="py-3 px-4 text-sm capitalize">{trans.type}</td>
                          <td className={`py-3 px-4 text-sm font-semibold text-right ${trans.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trans.amount > 0 ? '+' : ''}{trans.currency} {trans.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              trans.status === 'completed' ? 'bg-green-100 text-green-800' :
                              trans.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {trans.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Wallet Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-gray-600 text-sm">Total Income</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {wallet?.currency} {analytics.totalIncome?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <p className="text-gray-600 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {wallet?.currency} {analytics.totalExpenses?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-gray-600 text-sm">Net Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {wallet?.currency} {analytics.netBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <p className="text-gray-600 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.totalTransactions || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Request Deposit</h2>
            <form onSubmit={handleDeposit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <p className="text-sm text-yellow-700">
                  ℹ️ Your deposit request will be reviewed by an administrator. You will be notified once approved.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {pinModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Set Wallet PIN</h2>
            <form onSubmit={handleSetPin}>
              <input
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {pinError && <p className="text-red-600 text-sm mb-4">{pinError}</p>}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                >
                  Set PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinModalOpen(false);
                    setNewPin('');
                    setPinError('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {transferModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Money</h2>
            <form onSubmit={handleTransfer}>
              <input
                type="email"
                placeholder="Recipient Email"
                value={transferData.recipientEmail}
                onChange={(e) => setTransferData({ ...transferData, recipientEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Note (optional)"
                value={transferData.note}
                onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              ></textarea>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransferModal(false);
                    setTransferData({ recipientEmail: '', amount: '', note: '' });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Wallet;
