import { motion } from 'framer-motion';

export default function SocialLoginButton({ provider, onClick, isLoading }) {
  const providers = {
    google: { icon: '🔍', label: 'Continue with Google', color: 'bg-white hover:bg-gray-50 border border-gray-300' },
    facebook: { icon: '📘', label: 'Continue with Facebook', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  };

  const config = providers[provider];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${config.color}`}
    >
      <span>{config.icon}</span>
      {isLoading ? 'Signing in...' : config.label}
    </motion.button>
  );
}
