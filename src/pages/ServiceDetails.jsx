import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiMapPin, FiClock, FiCheck, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [eligibleBookingId, setEligibleBookingId] = useState(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        const srv = res.data.service;
        setService({
          ...srv,
          title: srv.title || srv.name,
          rating: srv.rating || 4.5,
          reviews: srv.totalReviews || srv.reviews?.length || 0,
          distance: srv.distance,
        });
      } catch (err) {
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await api.get(`/services/${id}/reviews`);
        setReviews(res.data.reviews || []);
      } catch (e) {
        // silent
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchEligibleBooking = async () => {
      if (!user) return;
      try {
        const res = await api.get('/bookings/user/my-bookings?status=completed');
        const bookings = res.data.bookings || [];
        const forThisService = bookings.filter((b) => b.service?._id === id || b.service === id);
        // pick latest if multiple
        if (forThisService.length) {
          setEligibleBookingId(forThisService[0]._id);
        } else {
          setEligibleBookingId(null);
        }
      } catch (e) {
        setEligibleBookingId(null);
      }
    };
    fetchEligibleBooking();
  }, [user, id]);

  const alreadyReviewed = useMemo(() => {
    if (!user) return false;
    return reviews.some((r) => (r.user?._id || r.user) === user._id);
  }, [reviews, user]);

  const book = async (e) => {
    e.preventDefault();
    if (!date || !slot) {
      setMessage('Please choose a date and time');
      setMessageType('error');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/bookings', { serviceId: id, date, slot, notes });
      setMessage('Booking created successfully!');
      setMessageType('success');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('Please login to book this service');
        setMessageType('error');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      setMessage(err.response?.data?.message || 'Booking failed');
      setMessageType('error');
    } finally {
      setBookingLoading(false);
    }
  };

  const provider = service?.provider || {};
  
  // Handle availability - support both old string format and new object format
  const getAvailabilityText = () => {
    const avail = service?.availability;
    if (!avail) return 'Monday to Sunday';
    if (typeof avail === 'string') return avail;
    if (Array.isArray(avail)) return avail.length > 0 ? 'Slots available' : 'Monday to Sunday';
    // If it's an object (new schedule format), display days enabled
    if (avail.schedule && typeof avail.schedule === 'object') {
      const days = Object.keys(avail.schedule || {})
        .filter(day => avail.schedule[day]?.enabled)
        .map(d => d.charAt(0).toUpperCase() + d.slice(1))
        .join(', ');
      return days || 'Custom hours';
    }
    return 'Contact for availability';
  };
  
  const availabilityText = getAvailabilityText();

  const buildMailto = () => {
    if (!provider.email) return '#';
    const subject = encodeURIComponent(`Inquiry about ${service?.title || 'your service'}`);
    const body = encodeURIComponent('Hi, I am interested in booking this service.');
    return `mailto:${provider.email}?subject=${subject}&body=${body}`;
  };

  const buildWhatsApp = () => {
    if (!provider.phone) return '#';
    const phone = provider.phone.replace(/[^\d+]/g, '');
    const text = encodeURIComponent(`Hi ${provider.name || ''}, I am interested in ${service?.title || 'your service'}.`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center pt-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center pt-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-2xl text-gray-500 font-semibold">Service not found</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 mb-6 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          <FiArrowLeft /> Back to Services
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Hero Image */}
          <div className="relative h-96 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <motion.div
              className="text-8xl text-white opacity-30"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {service.category?.charAt(0).toUpperCase() || 'S'}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full transition-all"
            >
              <FiShare2 className="text-gray-700" size={24} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Title & Price */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{service.title || service.name}</h1>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={20}
                          className={i < Math.floor(service.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600">({service.reviews} reviews)</span>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About this service</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {service.description || 'Professional service delivered with excellence and reliability'}
                  </p>
                </motion.div>

                {/* Info Cards */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-4 mb-8"
                >
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock className="text-blue-600" />
                      <span className="font-semibold text-gray-700">Availability</span>
                    </div>
                    <p className="text-sm text-gray-600">{availabilityText}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCheck className="text-green-600" />
                      <span className="font-semibold text-gray-700">Verified</span>
                    </div>
                    <p className="text-sm text-gray-600">Trusted provider</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiMapPin className="text-purple-600" />
                      <span className="font-semibold text-gray-700">Location</span>
                    </div>
                    <p className="text-sm text-gray-600">{service.distance?.toFixed(1) || '0'} km away</p>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-700">Category</span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{service.category || 'General'}</p>
                  </div>
                </motion.div>

                {/* Reviews */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
                  {reviewsLoading ? (
                    <div className="text-gray-500">Loading reviews…</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-gray-600">No reviews yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => (
                        <div key={rev._id} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                              <img
                                src={rev.user?.profilePicture || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (rev.user?.name || 'U')}
                                alt={rev.user?.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span className="font-semibold text-gray-900">{rev.user?.name || 'User'}</span>
                            </div>
                            <div className="flex items-center">
                              {[1,2,3,4,5].map((i) => (
                                <FiStar key={i} className={i <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                              ))}
                            </div>
                          </div>
                          {rev.comment && <p className="text-gray-700 mt-2 whitespace-pre-wrap">{rev.comment}</p>}
                          <p className="text-xs text-gray-500 mt-2">{new Date(rev.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leave a Review */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Leave a review</h3>
                    {!user ? (
                      <p className="text-sm text-gray-600">Please log in to write a review.</p>
                    ) : alreadyReviewed ? (
                      <p className="text-sm text-gray-600">You have already reviewed this service.</p>
                    ) : eligibleBookingId ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!rating) return;
                          setSubmittingReview(true);
                          try {
                            await api.post(`/services/${id}/reviews`, { rating, comment, bookingId: eligibleBookingId });
                            // refresh
                            const rr = await api.get(`/services/${id}/reviews`);
                            setReviews(rr.data.reviews || []);
                            setRating(0);
                            setComment('');
                          } catch (e) {
                            // noop
                          } finally {
                            setSubmittingReview(false);
                          }
                        }}
                        className="bg-gray-50 border rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {[1,2,3,4,5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() => setHoverRating(i)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(i)}
                              className="text-yellow-500"
                              aria-label={`Rate ${i}`}
                            >
                              <FiStar className={(hoverRating || rating) >= i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} size={24} />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-700">{rating ? `${rating}/5` : 'Select rating'}</span>
                        </div>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share details of your experience"
                          rows={3}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                        <div className="mt-3">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={submittingReview || !rating}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                          >
                            {submittingReview ? 'Submitting…' : 'Submit Review'}
                          </motion.button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Reviews are available after a completed booking.</p>
                      </form>
                    ) : (
                      <p className="text-sm text-gray-600">You can leave a review after completing a booking for this service.</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Booking Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-1"
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sticky top-32">
                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm mb-1">Starting from</p>
                    <p className="text-4xl font-bold text-blue-600">
                      TND {service.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Booking Form */}
                  <form onSubmit={book} className="space-y-6">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Select Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>

                    {/* Time Picker with Preset Slots */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Select Time</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map((timeSlot) => (
                          <motion.button
                            key={timeSlot}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSlot(timeSlot)}
                            className={`py-2 px-3 rounded-lg font-medium text-sm transition ${
                              slot === timeSlot
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            {timeSlot}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot ? slot.replace(/\s(AM|PM)/, '') : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const [hours, minutes] = e.target.value.split(':');
                              const hour = parseInt(hours);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                              setSlot(`${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`);
                            }
                          }}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          required
                        />
                        <span className="text-sm text-gray-600">or pick custom</span>
                      </div>
                      {slot && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <p className="text-sm text-blue-700 font-medium">✓ Selected: {slot}</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Notes for provider</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe your request or special instructions"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        rows={3}
                      />
                    </div>

                    {/* Message */}
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg text-sm font-medium ${
                          messageType === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {message}
                      </motion.div>
                    )}

                    {/* Book Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={bookingLoading}
                      className={`w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all ${bookingLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {bookingLoading ? 'Booking…' : 'Book Now'}
                    </motion.button>
                  </form>

                  {/* Trust Indicators */}
                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Secure payment</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Verified provider</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Money-back guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Contact Provider */}
                <div className="mt-4 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Provider</h3>
                  <p className="text-sm text-gray-700 mb-4">Reach out before booking if you have questions.</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    {provider.name && <div><span className="font-semibold">Name:</span> {provider.name}</div>}
                    {provider.email && <div><span className="font-semibold">Email:</span> {provider.email}</div>}
                    {provider.phone && <div><span className="font-semibold">Phone:</span> {provider.phone}</div>}
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="w-full text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition"
                      >
                        Call Provider
                      </a>
                    )}
                    {provider.email && (
                      <a
                        href={buildMailto()}
                        className="w-full text-center px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition"
                      >
                        Email Provider
                      </a>
                    )}
                    {provider.phone && (
                      <a
                        href={buildWhatsApp()}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full text-center px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
