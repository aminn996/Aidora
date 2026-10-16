import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerMessage('');
    setDevToken('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setServerMessage(res.data?.message || 'If an account exists, reset instructions were sent.');
      if (res.data?.resetToken) {
        setDevToken(res.data.resetToken);
      }
      toast.success('Check your email for reset link');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to process request';
      toast.error(msg);
      setServerMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 hover:text-blue-600"
          >
            <FiArrowLeft /> Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Forgot password</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your account email and we'll send a reset link.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </motion.button>
          </form>

          {serverMessage && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200">
              <FiCheckCircle className="mt-0.5" />
              <div>
                <p className="font-semibold">{serverMessage}</p>
                {devToken && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    Dev token: {devToken}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 text-center">
            Remembered your password?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
