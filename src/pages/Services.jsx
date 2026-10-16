import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiFilter, FiDollarSign, FiX, FiChevronDown, FiStar, FiPhone, FiMail, FiCrosshair } from 'react-icons/fi';
import api from '../services/api.js';
import ServiceCard from '../components/ServiceCard.jsx';
import useGeolocation from '../hooks/useGeolocation';

export default function Services() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('nearest');
  const [minRating, setMinRating] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userCity, setUserCity] = useState('Detecting…');
  const [locationMode, setLocationMode] = useState('auto'); // 'auto' | 'manual'
  const [manualCity, setManualCity] = useState('');
  const [manualCoords, setManualCoords] = useState({ lat: null, lng: null });
  const geo = useGeolocation();
  const userLocation = geo.coords;

  useEffect(() => {
    if (locationMode === 'auto') {
      setUserCity('Detecting…');
      geo.refresh?.();
      geo.startWatch?.();
    } else {
      geo.stopWatch?.();
    }
    return () => {
      geo.stopWatch?.();
    };
  }, [locationMode]);

  const categories = [
    'All Categories',
    'Home & Maintenance',
    'Automotive',
    'Technology & Electronics',
    'Personal Care & Beauty',
    'Health & Wellness',
    'Education & Training',
    'Business & Freelance',
    'Events & Media',
    'Delivery & Logistics',
    'Construction & Outdoor',
    'Security & Safety',
    'Pet Services'
  ];

  const cityOptions = [
    { label: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { label: 'Ariana', lat: 36.8665, lng: 10.1647 },
    { label: 'Ben Arous', lat: 36.7531, lng: 10.2183 },
    { label: 'Manouba', lat: 36.8080, lng: 10.0978 },
    { label: 'Nabeul', lat: 36.4510, lng: 10.7366 },
    { label: 'Zaghouan', lat: 36.4029, lng: 10.1429 },
    { label: 'Bizerte', lat: 37.2746, lng: 9.8739 },
    { label: 'Beja', lat: 36.7333, lng: 9.1833 },
    { label: 'Jendouba', lat: 36.5011, lng: 8.7790 },
    { label: 'Kef', lat: 36.1826, lng: 8.7140 },
    { label: 'Siliana', lat: 36.0833, lng: 9.3667 },
    { label: 'Sousse', lat: 35.8256, lng: 10.6360 },
    { label: 'Monastir', lat: 35.7772, lng: 10.8262 },
    { label: 'Mahdia', lat: 35.5039, lng: 11.0457 },
    { label: 'Sfax', lat: 34.7406, lng: 10.7603 },
    { label: 'Kairouan', lat: 35.6781, lng: 10.0963 },
    { label: 'Kasserine', lat: 35.1676, lng: 8.8365 },
    { label: 'Sidi Bouzid', lat: 35.0382, lng: 9.4850 },
    { label: 'Gabes', lat: 33.8815, lng: 10.0982 },
    { label: 'Medenine', lat: 33.3544, lng: 10.5055 },
    { label: 'Tataouine', lat: 32.9297, lng: 10.4518 },
    { label: 'Gafsa', lat: 34.4250, lng: 8.7842 },
    { label: 'Tozeur', lat: 33.9197, lng: 8.1335 },
    { label: 'Kebili', lat: 33.7073, lng: 8.9715 },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory, priceRange, sortBy, minRating]);

  // When geolocation arrives later, recompute distances for existing services
  useEffect(() => {
    if (!userLocation || services.length === 0) return;
    const coordsForDistance = locationMode === 'manual' && Number.isFinite(manualCoords.lat) && Number.isFinite(manualCoords.lng)
      ? manualCoords
      : userLocation;
    const updated = services.map((service) => {
      if (service.location?.coordinates && coordsForDistance) {
        const distance = calculateDistance(
          coordsForDistance.lat,
          coordsForDistance.lng,
          service.location.coordinates[1],
          service.location.coordinates[0]
        );
        return { ...service, distance };
      }
      return service;
    });
    setServices(updated);
  }, [userLocation, locationMode, manualCoords]);

  // Resolve user-facing location label (GPS reverse geocode, else use default)
  useEffect(() => {
    const resolveCity = async () => {
      // If we have precise coords, reverse geocode them for city/region
      if (geo.coords) {
        try {
          const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${geo.coords.lat}&longitude=${geo.coords.lng}&language=en&count=1`;
          const rsp = await fetch(url);
          if (rsp.ok) {
            const data = await rsp.json();
            const place = data.results?.[0];
            if (place) {
              const cityLabel = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
              setUserCity(cityLabel || 'Your location');
              return;
            }
          }
        } catch (e) {
          console.warn('Reverse geocode failed', e);
        }
        // If coords exist but reverse geocode failed, still indicate precise location
        setUserCity('Your location');
        return;
      }

      // Fallback to default Tunis coordinates
      setUserCity('Tunis');
    };

    resolveCity();
  }, [geo.coords, geo.source]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      const servicesData = res.data.services || res.data.data || res.data || [];
      console.log('Fetched services:', servicesData);
      const servicesWithDistance = servicesData.map(service => {
        let distance = Math.random() * 15 + 0.5;
        if (userLocation && service.location?.coordinates) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            service.location.coordinates[1],
            service.location.coordinates[0]
          );
        }
        return {
          ...service,
          distance,
          rating: service.rating || (Math.random() * 2 + 3.5),
        };
      });
      setServices(servicesWithDistance);
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services.filter(service => {
      const matchesSearch = 
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
      const price = service.price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesRating = (service.rating || 0) >= minRating;
      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    // Sort by selected option
    if (sortBy === 'nearest') {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredServices(filtered);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Location */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Explore Services</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-blue-600" size={20} />
              <p className="text-lg font-semibold">
                📍 {userCity}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm font-semibold">
              <button
                onClick={() => setLocationMode('auto')}
                className={`px-3 py-1 rounded-full transition ${locationMode === 'auto' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Auto
              </button>
              <button
                onClick={() => setLocationMode('manual')}
                className={`px-3 py-1 rounded-full transition ${locationMode === 'manual' ? 'bg-white dark:bg-gray-700 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Manual
              </button>
            </div>

            {locationMode === 'auto' && (
              <button
                onClick={() => geo.refresh()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                <FiCrosshair size={16} /> Use precise location
              </button>
            )}

            {locationMode === 'manual' && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={manualCity || ''}
                  onChange={(e) => {
                    const selected = cityOptions.find((c) => c.label === e.target.value);
                    setManualCity(e.target.value);
                    if (selected) {
                      setManualCoords({ lat: selected.lat, lng: selected.lng });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none"
                  style={{ minWidth: '160px' }}
                >
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city.label} value={city.label}>{city.label}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="City / Region"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none"
                  style={{ minWidth: '160px' }}
                />
                <input
                  type="number"
                  step="0.0001"
                  value={manualCoords.lat ?? ''}
                  onChange={(e) => setManualCoords((prev) => ({ ...prev, lat: parseFloat(e.target.value) }))}
                  placeholder="Lat"
                  className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={manualCoords.lng ?? ''}
                  onChange={(e) => setManualCoords((prev) => ({ ...prev, lng: parseFloat(e.target.value) }))}
                  placeholder="Lng"
                  className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 outline-none"
                />
                <button
                  onClick={() => {
                    setUserCity(manualCity || 'Custom location');
                    filterServices();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Apply
                </button>
              </div>
            )}

            <span className="text-gray-400">•</span>
            <p className="text-lg">
              {filteredServices.length} services available
            </p>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services, providers..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative min-w-[180px]">
              <FiFilter className="absolute left-4 top-4 text-gray-400 pointer-events-none" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-12 pr-8 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
              >
                <option value="nearest">Nearest</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters (Mobile-Collapsible) */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                    <FiDollarSign size={18} />
                    Price Range (TND)
                  </label>
                  <span className="text-blue-600 font-bold text-sm">
                    {priceRange[0]} - {priceRange[1]} TND
                  </span>
                </div>
                <div className="flex gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                    }}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                    }}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold mb-3">
                  <FiStar size={18} />
                  Minimum Rating
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map(rating => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMinRating(rating)}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        minRating === rating
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {rating === 0 ? 'All' : `${rating}+`}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Toggle Filters Button */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <FiChevronDown size={18} className={`transition transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </motion.button>
        </motion.div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full"
            />
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-2xl text-gray-500 dark:text-gray-400 font-semibold">No services found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">Try adjusting your filters or price range</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredServices.map(service => (
                <motion.div
                  key={service._id}
                  variants={itemVariants}
                  onClick={() => setSelectedService(service)}
                  className="cursor-pointer"
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>

            {/* Service Detail Modal */}
            <AnimatePresence>
              {selectedService && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedService(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                  >
                    {/* Header with Close */}
                    <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <h2 className="text-2xl font-bold">{selectedService.title}</h2>
                      <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-white/20 rounded-lg transition">
                        <FiX size={24} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                      {/* Price & Rating */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price per service</p>
                          <p className="text-3xl font-bold text-blue-600">{selectedService.price?.toFixed(2) || '0.00'} TND</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                size={20}
                                className={i < Math.floor(selectedService.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">({selectedService.totalReviews || 0} reviews)</p>
                        </div>
                      </div>

                      {/* Category & Location */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Category</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedService.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">Distance</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedService.distance?.toFixed(1) || 'N/A'} km</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Description</h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedService.description || 'No description available'}</p>
                      </div>

                      {/* Provider Info */}
                      {selectedService.provider && (
                        <div className="border-t pt-6">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Service Provider</h3>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                            <p className="font-semibold text-gray-900 dark:text-white">{selectedService.provider.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <FiMail size={16} />
                              {selectedService.provider.email}
                            </div>
                            {selectedService.provider.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FiPhone size={16} />
                                {selectedService.provider.phone}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                              ⭐ {selectedService.provider.providerProfile?.rating?.toFixed(1) || '0.0'} • {selectedService.provider.providerProfile?.completedBookings || 0} bookings completed
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                        >
                          Book Now
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 py-3 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                        >
                          Contact Provider
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {!loading && filteredServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-gray-600 dark:text-gray-400"
          >
            <p className="text-lg">Showing {filteredServices.length} of {services.length} services in {userCity}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
