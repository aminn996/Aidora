import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export default function GuestSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('aidora-language') || 'en';
    setSelectedLanguage(saved);
  }, []);

  const handleLanguageChange = (languageCode) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('aidora-language', languageCode);
    
    // Show confirmation
    const languageName = LANGUAGES.find(l => l.code === languageCode)?.name;
    toast.success(`Language changed to ${languageName}`);
    setShowNotification(true);
    
    // Reload page to apply language changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <FiGlobe size={32} className="text-aidora-green" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Customize your Aidora experience</p>
        </motion.div>

        {/* Language Settings Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <FiGlobe size={28} className="text-aidora-green" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Language Preference</h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Choose your preferred language. Your choice will be saved and applied across the platform.
          </p>

          {/* Language Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANGUAGES.map((language) => (
              <motion.button
                key={language.code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLanguageChange(language.code)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedLanguage === language.code
                    ? 'bg-aidora-green border-aidora-green text-white shadow-lg'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:border-aidora-green dark:hover:border-aidora-green'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">{language.flag}</span>
                  <div className="text-sm font-semibold text-center">{language.name}</div>
                  {selectedLanguage === language.code && (
                    <FiCheck size={20} className="mt-1" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ℹ️ Currently supported languages: English, French, Arabic, Spanish, German, Portuguese, Italian, and Turkish
            </p>
          </div>
        </motion.div>

        {/* Additional Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Other Preferences</h2>

          <div className="space-y-6">
            {/* Currency */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Currency</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Currently set to TND (Tunisian Dinar)</p>
              </div>
              <span className="text-2xl font-bold text-aidora-green">💰</span>
            </div>

            {/* Time Zone */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Time Zone</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Central European Time (CET)</p>
              </div>
              <span className="text-2xl font-bold">⏰</span>
            </div>

            {/* Units */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Distance Units</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kilometers (km)</p>
              </div>
              <span className="text-2xl font-bold">📏</span>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-aidora-green/10 to-emerald-500/10 dark:from-aidora-green/20 dark:to-emerald-500/20 border border-aidora-green/50 rounded-2xl p-8"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            💡 <strong>Tip:</strong> Your language preference is saved in your browser. 
            If you create an account, your settings will be synced across all devices.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
