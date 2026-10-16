import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 45000); // 45 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-50"
    >
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9}}
          className="mb-8 flex justify-center"
        >
          <svg width="80" height="80" viewBox="0 0 64 64" className="text-blue-600" fill="currentColor">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M32 12C20.95 12 12 20.95 12 32c0 8.63 6.12 15.85 14.28 17.4L32 32l14.28 17.4C45.88 47.85 52 40.63 52 32c0-11.05-8.95-20-20-20z" />
            <circle cx="32" cy="32" r="4" fill="currentColor" />
          </svg>
        </motion.div>

        {/* Loading Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Aidora
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-8 font-medium"
        >
          Find Trusted Services Near You
        </motion.p>

        {/* Animated Dots */}
        <motion.div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
