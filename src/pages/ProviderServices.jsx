import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const categories = [
  'Home & Maintenance', 'Automotive', 'Technology & Electronics',
  'Personal Care & Beauty', 'Health & Wellness', 'Education & Training',
  'Business & Freelance', 'Events & Media', 'Delivery & Logistics',
  'Construction & Outdoor', 'Security & Safety', 'Pet Services'
];

const availabilityOptions = [
  'Monday to Friday', 'Weekends', '24/7', 'By Appointment', 'Flexible'
];

export default function ProviderServices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providerId, setProviderId] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Home & Maintenance',
    price: '',
    availability: 'By Appointment',
    icon: '🔧'
  });

  useEffect(() => { fetchServices(); }, [user?.id]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: provider, error: providerError } = await supabase.from('provider_profiles').select('id').eq('user_id', user?.id).maybeSingle();
      if (providerError) throw providerError;
      setProviderId(provider?.id || null);
      if (!provider) { setServices([]); return; }
      const { data, error } = await supabase.from('services').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => { setBookings([]); };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'confirmed' });
      toast.success('Booking accepted!');
      fetchBookings();
    } catch (err) {
      console.error('Error accepting booking:', err);
      toast.error('Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      toast.success('Booking declined');
      fetchBookings();
    } catch (err) {
      console.error('Error declining booking:', err);
      toast.error('Failed to decline booking');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase.from('services').update({ title: formData.title, description: formData.description, category: formData.category, price: Number(formData.price) || null }).eq('id', editingService.id).eq('provider_id', providerId); if (error) throw error;
        toast.success('Service updated successfully');
      } else {
        const { error } = await supabase.from('services').insert({ provider_id: providerId, title: formData.title, description: formData.description, category: formData.category, price: Number(formData.price) || null, pricing_type: 'FIXED', currency: 'EUR', is_active: false }); if (error) throw error;
        toast.success('Service created successfully');
      }
      
      setFormData({
        title: '',
        description: '',
        category: 'Home & Maintenance',
        price: '',
        availability: 'By Appointment',
        icon: '🔧'
      });
      setEditingService(null);
      setActiveTab('list');
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      toast.error(err.response?.data?.message || 'Failed to save service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price,
      availability: service.availability || 'By Appointment',
      icon: service.icon || '🔧'
    });
    setActiveTab('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id).eq('provider_id', providerId); if (error) throw error;
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      toast.error('Failed to delete service');
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Home & Maintenance',
      price: '',
      availability: 'By Appointment',
      icon: '🔧'
    });
    setEditingService(null);
  };

  const emojis = ['🔧', '🏠', '🚗', '💻', '✨', '💪', '📚', '🎓', '🎉', '🚚', '🏗️', '🐕'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💼</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Provider Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your services and bookings</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              My Profile
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-600"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-1">Total Services</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{services.length}</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-yellow-600"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-1">Pending Bookings</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{bookings.filter(b => b.status === 'pending').length}</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-600"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-1">Confirmed Bookings</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg w-fit"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            My Services ({services.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Incoming Bookings ({bookings.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/provider/services/create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl`}
          >
            <FiPlus size={20} />
            Create New Service
          </motion.button>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full"
                  />
                </div>
              ) : services.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Services Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first service to start offering professional services</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/provider/services/create')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
                  >
                    Create Your First Service
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {services.map((service, index) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{service.icon || '🔧'}</div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(service)}
                            className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                          >
                            <FiEdit2 size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(service._id)}
                            className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                          >
                            <FiTrash2 size={18} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {service.title}
                      </h3>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                        {service.category}
                      </span>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Price & Availability */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">Price</span>
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {service.price?.toFixed(2) || '0.00'} TND
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">Availability</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FiCheck size={16} />
                            {service.availability || 'By Appointment'}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 flex gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                          <p className="font-bold text-gray-900 dark:text-white">{service.rating?.toFixed(1) || '0.0'} ⭐</p>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Reviews</p>
                          <p className="font-bold text-gray-900 dark:text-white">{service.totalReviews || 0}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Emoji Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Service Icon
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {emojis.map(emoji => (
                      <motion.button
                        key={emoji}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={`text-2xl p-3 rounded-lg transition ${
                          formData.icon === emoji
                            ? 'bg-blue-600 shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., House Cleaning Service"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your service in detail..."
                    rows="5"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition resize-none"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition appearance-none cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Price (TND) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Availability
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availabilityOptions.map(option => (
                      <motion.button
                        key={option}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData({ ...formData, availability: option })}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          formData.availability === option
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <FiCheck size={20} />
                    {editingService ? 'Update Service' : 'Create Service'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      handleCancel();
                      setActiveTab('list');
                    }}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <FiX size={20} />
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === 'bookings' ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {bookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">Bookings from customers will appear here</p>
                </motion.div>
              ) : (
                <motion.div
                  variants={{ container: { staggerChildren: 0.1 } }}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {bookings.map((booking) => (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Service</p>
                          <p className="font-bold text-gray-900 dark:text-white">{booking.service?.title}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Customer</p>
                          <p className="font-bold text-gray-900 dark:text-white">{booking.user?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.user?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Date & Time</p>
                          <p className="font-bold text-gray-900 dark:text-white">{new Date(booking.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.slot}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Notes:</strong> {booking.notes}</p>
                        </div>
                      )}
                      {booking.status === 'pending' && (
                        <div className="mt-4 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAcceptBooking(booking._id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                            <FiCheck size={18} />
                            Accept
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeclineBooking(booking._id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                            <FiX size={18} />
                            Decline
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
