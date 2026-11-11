import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, isAuthenticated, login, googleLogin, geolocation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const destination = (roleOverride) => {
    const redirect = new URLSearchParams(location.search).get('redirect');
    if (redirect?.startsWith('/') && !redirect.startsWith('//')) return redirect;
    if ((roleOverride || user?.role) === 'admin') return '/admin';
    if ((roleOverride || user?.role) === 'provider') return '/provider/dashboard';
    return '/dashboard';
  };

  useEffect(() => {
    if (isAuthenticated && user) navigate(destination(), { replace: true });
  }, [isAuthenticated, user, location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(destination(result.user?.role), { replace: true });
    } catch (err) {
      const authMessage = err?.message?.toLowerCase() || '';
      const errorMsg = authMessage.includes('invalid login') || authMessage.includes('invalid credentials')
        ? 'Email or password is incorrect.'
        : authMessage.includes('email not confirmed')
          ? 'Please confirm your email address before signing in.'
          : authMessage.includes('too many requests') || authMessage.includes('rate limit')
            ? 'Too many sign-in attempts. Please wait a few minutes and try again.'
            : authMessage.includes('failed to fetch') || authMessage.includes('network')
              ? "We couldn't reach Aidora. Check your connection and try again."
              : 'Sign-in failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const toastId = toast.loading('Opening secure Google sign-in...');
    try {
      await googleLogin();
    } catch (err) {
      toast.error('Google sign-in could not be started. Please try again.', { id: toastId });
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left - Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden md:block"
        >
          <img 
            src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&h=800&fit=crop"
            alt="Professional Services"
            className="rounded-2xl shadow-2xl"
          />
        </motion.div>

        {/* Right - Form */}
        <div className="w-full">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-aidora-dark rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400">Sign in to your Aidora account</p>
            </div>

            <div className="flex justify-end text-sm">
              <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-aidora-green/20 bg-aidora-green/5 p-4">
              <FiMapPin className="mt-0.5 shrink-0 text-aidora-green" size={18} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {geolocation?.address?.city ? `Discover trusted services near ${geolocation.address.city}` : 'Discover trusted services near you'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  {geolocation?.permission === 'granted' ? 'Your location is ready to personalize your marketplace.' : 'Location is optional and only used to improve nearby recommendations.'}
                </p>
              </div>
            </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-aidora-green transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-aidora-green transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-aidora-green to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </motion.button>


          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-aidora-green font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
