import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiStar, FiShield, FiZap, FiBell, FiLock, FiArrowRight } from 'react-icons/fi';
import useGeolocation from '../hooks/useGeolocation';
import Logo from '../components/Logo.jsx';

// Service categories
const SERVICE_CATEGORIES = [
  { id: 1, name: 'Mechanics', emoji: '🚗', description: 'Car services & maintenance' },
  { id: 2, name: 'Plumbing', emoji: '🔧', description: 'Plumbers & electricians' },
  { id: 3, name: 'Home Services', emoji: '🏠', description: 'Maintenance & repairs' },
  { id: 4, name: 'IT & Freelance', emoji: '🧑‍💻', description: 'Tech & freelance work' },
  { id: 5, name: 'Delivery', emoji: '📦', description: 'Transport & delivery' },
  { id: 6, name: 'Health', emoji: '🏥', description: 'Health & wellness' },
  { id: 7, name: 'Education', emoji: '📚', description: 'Tutoring & courses' },
  { id: 8, name: 'Cleaning', emoji: '🧹', description: 'Professional cleaning' },
];

const FEATURES = [
  { icon: FiMapPin, title: 'Smart Location Matching', description: 'Services matched to your exact location' },
  { icon: FiStar, title: 'Verified & Rated', description: 'All providers thoroughly vetted' },
  { icon: FiShield, title: 'Secure Payments', description: 'Safe transactions in TND' },
  { icon: FiZap, title: 'Fast & Responsive', description: 'Quick booking experience' },
  { icon: FiBell, title: 'Real-time Notifications', description: 'Instant updates on services' },
  { icon: FiLock, title: 'Secure Authentication', description: 'Your data is protected' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Choose Your Service', description: 'Browse our wide range of professional services' },
  { step: 2, title: 'Get Matched Nearby', description: 'Discover vetted providers around you' },
  { step: 3, title: 'Book & Rate', description: 'Book instantly and rate your experience' },
];

export default function Home() {
  const [userCity, setUserCity] = useState(null);
  const { coords, error: geoError } = useGeolocation();

  useEffect(() => {
    if (coords?.lat && coords?.lng) {
      // Keep the location label honest until a reverse-geocoding result is available.
      setUserCity('your area');
    }
  }, [coords]);

  return (
    <div className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* Hero Section */}
      <section className="relative w-full py-24 px-4 md:px-8 overflow-hidden bg-white dark:bg-gray-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                Find Trusted Services Near You
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Aidora connects you with verified professionals around you, based on your real-time location.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/register"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Get Started <FiArrowRight size={20} />
                </Link>
                <Link
                  to="/services"
                  className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 font-bold rounded-lg transition-colors"
                >
                  Explore Services
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-blue-600">100+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Services</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">500+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Providers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">4.8★</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <Logo size="xl" showText={false} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="w-full py-12 px-4 md:px-8 bg-blue-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4"
          >
            <FiMapPin className="text-blue-600 text-2xl flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Showing services near {userCity || 'your location'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {geoError ? 'Enable location for best results' : 'Location enabled'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full py-20 px-4 md:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">Browse Services</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Find exactly what you need</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Link to={`/services?category=${cat.name}`}>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="text-4xl mb-3">{cat.emoji}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{cat.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{cat.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4 md:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">Why Choose Aidora</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Everything you need for trusted services</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-20 px-4 md:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Three simple steps</p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-stretch gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex-1 flex flex-col">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl mb-4"
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section className="w-full py-16 px-4 md:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Quick Sign In</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Choose your preferred method</p>
          </motion.div>

          <div className="space-y-3">
            <button className="w-full py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.866v3.471h5.183c-0.305 1.584-1.639 4.649-5.183 4.649-3.119 0-5.668-2.589-5.668-5.77 0-3.179 2.548-5.77 5.668-5.77 1.779 0 2.971 0.758 3.652 1.413 0.787-0.758 0.728-0.868 2.749-2.82-1.194-1.113-3.069-1.789-6.401-1.789-5.314 0-9.668 4.354-9.668 9.769 0 5.416 4.354 9.769 9.668 9.769 5.576 0 9.294-3.925 9.294-9.45 0-0.618-0.069-1.092-0.154-1.563h-9.146z" />
              </svg>
              Google
            </button>

            <button className="w-full py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Facebook
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">Or</span>
              </div>
            </div>

            <Link
              to="/register"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 md:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands finding quality services instantly
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Create Account
              </Link>
              <Link
                to="/services"
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Browse Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
