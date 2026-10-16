import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';

const AdminWallets = () => {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('wallets'); // wallets, withdrawals, deposits, stats
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'wallets') {
        const res = await api.get('/wallets/admin/all', {
          params: { page: currentPage, limit: 20, search: searchTerm }
        });
        setWallets(res.data.wallets);
        setTotalPages(res.data.totalPages);
        if (res.data.stats) setStats(res.data.stats);
      } else if (activeTab === 'withdrawals') {
        const res = await api.get('/wallets/admin/withdrawals/pending', {
          params: { page: currentPage, limit: 20 }
        });
        setPendingWithdrawals(res.data.transactions);
        setTotalPages(res.data.totalPages);
      } else if (activeTab === 'deposits') {
        const res = await api.get('/wallets/admin/deposits/pending', {
          params: { page: currentPage, limit: 20 }
        });
        setPendingDeposits(res.data.transactions);
        setTotalPages(res.data.totalPages);
      } else if (activeTab === 'stats') {
        const res = await api.get('/wallets/admin/stats');
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (transactionId, status) => {
    const adminNotes = prompt(`Enter notes for ${status}:`);
    
    try {
      await api.put(`/wallets/admin/withdrawals/${transactionId}`, {
        status,
        adminNotes
      });
      alert(`Withdrawal ${status} successfully`);
      fetchData();
    } catch (error) {
      console.error('Process withdrawal error:', error);
      alert(error.response?.data?.message || 'Failed to process withdrawal');
    }
  };

  const handleProcessDeposit = async (transactionId, action) => {
    const notes = prompt(`Enter notes for ${action}:`);
    if (!notes && action === 'reject') {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return;
    }
    
    try {
      await api.put(`/wallets/admin/deposits/${transactionId}/${action}`, {
        notes,
        reason: action === 'reject' ? notes : undefined
      });
      alert(`Deposit ${action}d successfully`);
      fetchData();
    } catch (error) {
      console.error('Process deposit error:', error);
      alert(error.response?.data?.message || `Failed to ${action} deposit`);
    }
  };

  const handleAdjustBalance = async (userId, userName) => {
    const amount = prompt(`Enter adjustment amount for ${userName} (use negative for deduction):`);
    if (!amount || isNaN(amount)) return;
    
    const reason = prompt('Enter reason for adjustment:');
    if (!reason) return;
    
    try {
      await api.post(`/wallets/admin/adjust/${userId}`, {
        amount: parseFloat(amount),
        reason
      });
      alert('Balance adjusted successfully');
      fetchData();
    } catch (error) {
      console.error('Adjust balance error:', error);
      alert(error.response?.data?.message || 'Failed to adjust balance');
    }
  };

  const handleToggleFreeze = async (userId, userName, isFrozen) => {
    const action = isFrozen ? 'unfreeze' : 'freeze';
    const reason = isFrozen ? null : prompt(`Enter reason to freeze ${userName}'s wallet:`);
    
    if (!isFrozen && !reason) return;
    
    try {
      await api.put(`/wallets/admin/freeze/${userId}`, { reason });
      alert(`Wallet ${action}d successfully`);
      fetchData();
    } catch (error) {
      console.error('Toggle freeze error:', error);
      alert(error.response?.data?.message || `Failed to ${action} wallet`);
    }
  };

  if (loading && !wallets.length && !pendingWithdrawals.length) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Wallet Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['wallets', 'deposits', 'withdrawals', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Wallets</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWallets || 0}</p>
            <p className="text-xs text-green-600 mt-1">Active: {stats.activeWallets || 0}</p>
            <p className="text-xs text-red-600">Frozen: {stats.frozenWallets || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Balance</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalBalance?.toFixed(2) || '0.00'} TND
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Pending Withdrawals: {stats.totalPendingWithdrawal?.toFixed(2) || '0.00'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Transactions</p>
            <p className="text-xl font-bold text-green-600">
              Deposits: {stats.totalDeposited?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xl font-bold text-red-600">
              Withdrawals: {stats.totalWithdrawn?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xl font-bold text-blue-600">
              Earnings: {stats.totalEarned?.toFixed(2) || '0.00'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Requests</p>
            <p className="text-2xl font-bold text-yellow-600">
              Withdrawals: {stats.pendingWithdrawalsCount || 0}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              Deposits: {stats.pendingDepositsCount || 0}
            </p>
          </motion.div>
        </div>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {wallets.map((wallet) => (
                    <tr key={wallet._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {wallet.user?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {wallet.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {wallet.user?.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {wallet.balance?.toFixed(2)} TND
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-yellow-600">{wallet.pendingWithdrawal?.toFixed(2) || '0.00'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-green-600">{wallet.totalEarned?.toFixed(2) || '0.00'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            wallet.isFrozen
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {wallet.isFrozen ? 'Frozen' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAdjustBalance(wallet.user?._id, wallet.user?.name)
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() =>
                              handleToggleFreeze(
                                wallet.user?._id,
                                wallet.user?.name,
                                wallet.isFrozen
                              )
                            }
                            className={`text-sm font-medium ${
                              wallet.isFrozen
                                ? 'text-green-600 hover:text-green-800'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                          >
                            {wallet.isFrozen ? 'Unfreeze' : 'Freeze'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Deposits Tab */}
      {activeTab === 'deposits' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingDeposits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No pending deposit requests
                    </td>
                  </tr>
                ) : (
                  pendingDeposits.map((txn) => (
                    <tr key={txn._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {txn.user?.firstName} {txn.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {txn.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-green-600">
                          +{txn.amount.toFixed(2)} {txn.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(txn.createdAt).toLocaleDateString()}
                        <br />
                        {new Date(txn.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {txn.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessDeposit(txn._id, 'approve')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleProcessDeposit(txn._id, 'reject')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No pending withdrawals
                    </td>
                  </tr>
                ) : (
                  pendingWithdrawals.map((txn) => (
                    <tr key={txn._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {txn.user?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {txn.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-bold text-red-600">
                          {Math.abs(txn.amount).toFixed(2)} {txn.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {txn.withdrawalMethod}
                      </td>
                      <td className="px-6 py-4">
                        {txn.withdrawalDetails && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>{txn.withdrawalDetails.accountName}</p>
                            <p>{txn.withdrawalDetails.bankName}</p>
                            <p className="font-mono">{txn.withdrawalDetails.accountNumber}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessWithdrawal(txn._id, 'completed')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessWithdrawal(txn._id, 'failed')}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallets;
