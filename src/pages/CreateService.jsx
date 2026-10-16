import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiDollarSign,
  FiClock,
  FiImage,
  FiEye,
  FiMapPin,
  FiTag,
  FiHelpCircle,
  FiX,
  FiPlus,
  FiUpload,
  FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: FiInfo },
  { id: 2, title: 'Pricing', icon: FiDollarSign },
  { id: 3, title: 'Availability', icon: FiClock },
  { id: 4, title: 'Media & Details', icon: FiImage },
  { id: 5, title: 'Review', icon: FiEye },
];

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Moving',
  'Tutoring',
  'Beauty',
  'Repair',
  'Gardening',
  'IT Support',
  'Other',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function CreateService() {
  const navigate = useNavigate();
  const { user, geolocation } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'TND',
    priceType: 'fixed',
    pricingTiers: [],
    serviceType: 'onsite',
    duration: '',
    tags: [],
    requirements: '',
    cancellationPolicy: '24 hours notice required',
    maxBookingsPerDay: 10,
    faqs: [],
    images: [],
    videoUrl: '',
    location: {
      type: 'Point',
      coordinates: [10.1815, 36.8065], // default Tunis
      address: '',
      serviceRadius: 10,
    },
    availability: {
      schedule: {
        monday: { enabled: true, slots: ['09:00', '14:00'] },
        tuesday: { enabled: true, slots: ['09:00', '14:00'] },
        wednesday: { enabled: true, slots: ['09:00', '14:00'] },
        thursday: { enabled: true, slots: ['09:00', '14:00'] },
        friday: { enabled: true, slots: ['09:00', '14:00'] },
        saturday: { enabled: false, slots: [] },
        sunday: { enabled: false, slots: [] },
      },
      exceptions: [],
    },
  });

  const [tagInput, setTagInput] = useState('');

  // Image upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    // Convert to base64 for preview (in production, upload to cloud storage)
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            preview: reader.result,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateField = (path, value) => {
    setFormData((prev) => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim().toLowerCase()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addFAQ = () => {
    setFormData((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  };

  const updateFAQ = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    }));
  };

  const removeFAQ = (index) => {
    setFormData((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  const addPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, { name: '', description: '', price: '', duration: '' }],
    }));
  };

  const updatePricingTier = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)),
    }));
  };

  const removePricingTier = (index) => {
    setFormData((prev) => ({ ...prev, pricingTiers: prev.pricingTiers.filter((_, i) => i !== index) }));
  };

  const toggleDay = (day) => {
    updateField(`availability.schedule.${day}.enabled`, !formData.availability.schedule[day].enabled);
  };

  const updateDaySlots = (day, slots) => {
    updateField(`availability.schedule.${day}.slots`, slots);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error('Service title is required');
          return false;
        }
        if (!formData.category) {
          toast.error('Please select a category');
          return false;
        }
        return true;
      case 2:
        if (!formData.price || formData.price <= 0) {
          toast.error('Please enter a valid price');
          return false;
        }
        return true;
      case 3:
        const hasEnabledDay = DAYS.some((day) => formData.availability.schedule[day].enabled);
        if (!hasEnabledDay) {
          toast.error('Please enable at least one day of availability');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    try {
      // Use geolocation if available
      if (geolocation.coords) {
        formData.location.coordinates = [geolocation.coords.lng, geolocation.coords.lat];
      }

      // Combine URL images with uploaded images (base64 for demo)
      const allImages = [
        ...formData.images,
        ...uploadedImages.map((img) => img.preview),
      ].filter(Boolean);

      // Clean up data
      const payload = {
        ...formData,
        images: allImages,
        price: Number(formData.price),
        duration: formData.duration ? Number(formData.duration) : undefined,
        maxBookingsPerDay: Number(formData.maxBookingsPerDay),
        pricingTiers: formData.pricingTiers
          .filter((t) => t.name && t.price)
          .map((t) => ({
            ...t,
            price: Number(t.price),
            duration: t.duration ? Number(t.duration) : undefined,
          })),
        faqs: formData.faqs.filter((f) => f.question && f.answer),
        location: {
          ...formData.location,
          serviceRadius: Number(formData.location.serviceRadius),
        },
      };

      await api.post('/services', payload);
      toast.success('Service created successfully!');
      navigate('/provider/services');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'provider') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Only providers can create services</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create New Service</h1>
          <p className="text-gray-600 dark:text-gray-400">Fill in the details to list your service</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 ${
                    currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? <FiCheck size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className="hidden md:block font-medium">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Basic Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Professional Home Cleaning"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={5}
                    placeholder="Describe your service in detail..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Type
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => updateField('serviceType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    >
                      <option value="onsite">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      placeholder="e.g., 60"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pricing</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Price *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Type
                    </label>
                    <select
                      value={formData.priceType}
                      onChange={(e) => updateField('priceType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Per Hour</option>
                      <option value="daily">Per Day</option>
                      <option value="package">Package</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pricing Tiers (optional)
                    </label>
                    <button
                      onClick={addPricingTier}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <FiPlus /> Add Tier
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.pricingTiers.map((tier, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => updatePricingTier(index, 'name', e.target.value)}
                              placeholder="Tier name (e.g., Basic, Premium)"
                              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                            <input
                              type="number"
                              value={tier.price}
                              onChange={(e) => updatePricingTier(index, 'price', e.target.value)}
                              placeholder="Price"
                              min="0"
                              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <button
                            onClick={() => removePricingTier(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiX />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={tier.description}
                          onChange={(e) => updatePricingTier(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={formData.cancellationPolicy}
                    onChange={(e) => updateField('cancellationPolicy', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Availability */}
            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Availability</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Bookings Per Day
                  </label>
                  <input
                    type="number"
                    value={formData.maxBookingsPerDay}
                    onChange={(e) => updateField('maxBookingsPerDay', e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Weekly Schedule
                  </label>
                  <div className="space-y-3">
                    {DAYS.map((day) => {
                      const dayData = formData.availability.schedule[day];
                      return (
                        <div key={day} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={dayData.enabled}
                                onChange={() => toggleDay(day)}
                                className="w-5 h-5 rounded text-blue-600"
                              />
                              <span className="font-medium capitalize">{day}</span>
                            </label>
                          </div>
                          {dayData.enabled && (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={dayData.slots.join(', ')}
                                onChange={(e) => updateDaySlots(day, e.target.value.split(',').map((s) => s.trim()))}
                                placeholder="e.g., 09:00, 14:00, 18:00"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                              />
                              <p className="text-xs text-gray-500 mt-1">Enter time slots separated by commas</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Media & Details */}
            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Media & Additional Details</h2>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Service Images
                  </label>
                  
                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    <FiUpload className="mx-auto text-4xl text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB each
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Image Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((image) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <FiTrash2 size={14} />
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Alternative: Image URLs */}
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Or enter image URLs (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.images.join(', ')}
                      onChange={(e) => updateField('images', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => updateField('videoUrl', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1 text-sm"
                      >
                        <FiTag size={12} />
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-blue-900">
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements (What customers need to prepare)
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => updateField('requirements', e.target.value)}
                    rows={3}
                    placeholder="e.g., Clean workspace, power outlet, etc."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    maxLength={1000}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      FAQs
                    </label>
                    <button onClick={addFAQ} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      <FiPlus /> Add FAQ
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.faqs.map((faq, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <FiHelpCircle className="text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                              placeholder="Question"
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                            <textarea
                              value={faq.answer}
                              onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                              placeholder="Answer"
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <button onClick={() => removeFAQ(index)} className="text-red-600 hover:text-red-700">
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={formData.location.address}
                      onChange={(e) => updateField('location.address', e.target.value)}
                      placeholder="Enter service area address"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Radius (km)
                    </label>
                    <input
                      type="number"
                      value={formData.location.serviceRadius}
                      onChange={(e) => updateField('location.serviceRadius', e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Review & Submit</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{formData.title}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{formData.category} • {formData.serviceType}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Base Price</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formData.price} {formData.currency}
                      </p>
                      <p className="text-xs text-gray-500">{formData.priceType}</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formData.duration || 'Flexible'}
                      </p>
                      <p className="text-xs text-gray-500">minutes</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formData.description || 'No description'}</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.filter((day) => formData.availability.schedule[day].enabled).map((day) => (
                        <span key={day} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs capitalize">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(uploadedImages.length > 0 || formData.images.length > 0) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Images</p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {uploadedImages.map((img) => (
                          <img
                            key={img.id}
                            src={img.preview}
                            alt={img.name}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                        {formData.images.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Service ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.pricingTiers.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing Tiers</p>
                      <div className="space-y-2">
                        {formData.pricingTiers.filter(t => t.name && t.price).map((tier, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{tier.name}</span>
                            <span className="text-gray-600 dark:text-gray-400">{tier.price} {formData.currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.faqs.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">FAQs</p>
                      <p className="text-xs text-gray-500">{formData.faqs.filter(f => f.question && f.answer).length} questions added</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft /> Previous
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next <FiChevronRight />
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                <FiCheck /> {submitting ? 'Creating...' : 'Create Service'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
