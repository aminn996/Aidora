import { BsMoon, BsSun } from 'react-icons/bs';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleToggle = () => {
    toggleDarkMode();
    toast.success(isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode', {
      duration: 2,
      position: 'top-center',
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 transition-colors duration-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <BsSun className="w-5 h-5" />
      ) : (
        <BsMoon className="w-5 h-5" />
      )}
    </motion.button>
  );
}



