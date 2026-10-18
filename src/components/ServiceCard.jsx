import { motion } from 'framer-motion';
import { FiStar, FiMapPin, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const getCategoryImage = (category) => {
  const categoryMap = {
    'Home & Maintenance': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    'Automotive': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop',
    'Technology & Electronics': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    'Personal Care & Beauty': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
    'Health & Wellness': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    'Education & Training': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    'Business & Freelance': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    'Events & Media': 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
    'Delivery & Logistics': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
    'Construction & Outdoor': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
    'Security & Safety': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop',
    'Pet Services': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
  };
  return categoryMap[category] || 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=300&fit=crop';
};

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const distance = service.distance ? service.distance.toFixed(1) : 'N/A';
  const isAvailable = Array.isArray(service.availability) && service.availability.length > 0;

  const goToDetails = () => {
    const id = service._id || service.id;
    if (id) navigate(`/services/${id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={goToDetails}
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl transition-all cursor-pointer h-full flex flex-col group"
    >
      {/* Image Container */}
      <div className="relative h-56 bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden">
        <motion.img
          src={getCategoryImage(service.category)}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Price Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-full text-sm font-bold text-blue-600 dark:text-blue-400 shadow-lg flex items-center gap-1"
        >
          <span className="text-lg">💰</span>
          {service.price != null ? Number(service.price).toFixed(2) : 'Quote'} {service.currency || 'EUR'}
        </motion.div>

        {/* Availability Badge */}
        {isAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg"
          >
            <FiCheck size={14} />
            Available
          </motion.div>
        )}

        {/* Icon */}
        <div className="absolute bottom-4 left-4 text-4xl">
          {service.icon || '🔧'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {service.title}
        </h3>

        {/* Category Badge */}
        <div className="inline-block mb-3 w-fit">
          <span className="text-xs text-white bg-blue-600 dark:bg-indigo-600 px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
            {service.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
          {service.description || 'Professional service offering quality results'}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

        {/* Rating & Distance */}
        <div className="space-y-2 mb-4">
          {/* Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={16}
                    className={i < Math.floor(service.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {service.rating?.toFixed(1) || '0.0'} ({service.totalReviews || 0})
              </span>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiMapPin size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-medium">{distance} km away</span>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToDetails}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
}
