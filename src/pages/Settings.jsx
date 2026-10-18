import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBell,
  FiCamera,
  FiGlobe,
  FiLock,
  FiMapPin,
  FiSave,
  FiSettings as FiSettingsIcon,
  FiShield,
  FiUser,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import GuestSettings from './GuestSettings';

const DEFAULT_NOTIFICATIONS = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  bookingReminders: true,
  productUpdates: false,
};

const DEFAULT_PREFERENCES = {
  language: 'en',
  currency: 'USD',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  distanceUnit: 'km',
  theme: 'system',
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Francais' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Espanol' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'tr', name: 'Turkce' },
];

const CURRENCIES = ['TND', 'EUR', 'USD'];
const TIMEZONES = ['Africa/Tunis', 'Europe/Paris', 'UTC', 'Africa/Cairo'];
const DISTANCE_UNITS = [
  { value: 'km', label: 'Kilometers (km)' },
  { value: 'mi', label: 'Miles (mi)' },
];

export default function Settings() {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [activeTab, setActiveTab] = useState('profile');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    profilePicture: null,
  });

  const [providerForm, setProviderForm] = useState({
    bio: '',
    skills: '',
    servicesOffered: '',
    hourlyRate: '',
    availabilityNote: '',
  });

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const isProvider = user?.role === 'provider';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      address: user.address || '',
      profilePicture: null,
    });
    setPreviewUrl(user.profilePicture || null);

    const provider = user.providerProfile || {};
    setProviderForm({
      bio: provider.bio || '',
      skills: (provider.skills || []).join(', '),
      servicesOffered: (provider.servicesOffered || [])
        .map((s) => `${s.title}${s.price ? ` | ${s.price}` : ''}`)
        .join('\n'),
      hourlyRate: provider.hourlyRate ?? '',
      availabilityNote: provider.availabilityNote || '',
    });

    setNotifications({ ...DEFAULT_NOTIFICATIONS, ...(user.notificationPreferences || {}) });
    setPreferences({ ...DEFAULT_PREFERENCES, ...(user.preferences || {}) });
  }, [user]);

  const servicesList = useMemo(() => {
    if (!providerForm.servicesOffered) return [];
    return providerForm.servicesOffered
      .split('\n')
      .map((line) => {
        const [title, price] = line.split('|').map((p) => p && p.trim());
        if (!title) return null;
        return { title, price: price ? Number(price) : undefined };
      })
      .filter(Boolean);
  }, [providerForm.servicesOffered]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }
    setProfileForm((prev) => ({ ...prev, profilePicture: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileForm((prev) => ({ ...prev, profilePicture: null }));
    setPreviewUrl(user?.profilePicture || null);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name) {
      toast.error('Name is required');
      return;
    }
    setSavingProfile(true);
    try {
      let profilePictureUrl = user?.profilePicture;
      if (profileForm.profilePicture) {
        profilePictureUrl = previewUrl;
      }

      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        city: profileForm.city,
        address: profileForm.address,
        profilePicture: profilePictureUrl,
      });
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveProvider = async () => {
    setSavingProvider(true);
    try {
      await updateProfile({
        bio: providerForm.bio,
        skills: providerForm.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        servicesOffered: servicesList,
        hourlyRate: providerForm.hourlyRate === '' ? undefined : Number(providerForm.hourlyRate),
        availabilityNote: providerForm.availabilityNote,
      });
      toast.success('Provider profile updated');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update provider profile');
    } finally {
      setSavingProvider(false);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateProfile({
        preferences,
        notificationPreferences: notifications,
      });
      if (preferences.theme === 'dark' && !isDarkMode) toggleDarkMode();
      if (preferences.theme === 'light' && isDarkMode) toggleDarkMode();
      localStorage.setItem('aidora-language', preferences.language);
      toast.success('Preferences saved');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPrefs(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300">
        Loading settings...
      </div>
    );
  }

  if (!user) {
    return <GuestSettings />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and security</p>
        </motion.div>

        <div className="flex gap-2 mb-8 border-b border-gray-300 dark:border-gray-700 overflow-x-auto pb-0">
          {[
            { id: 'profile', label: 'Profile', icon: FiUser },
            ...(isProvider ? [{ id: 'provider', label: 'Provider', icon: FiMapPin }] : []),
            { id: 'security', label: 'Security', icon: FiLock },
            { id: 'notifications', label: 'Notifications', icon: FiBell },
            { id: 'preferences', label: 'Preferences', icon: FiSettingsIcon },
            ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: FiShield }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={saveProfile} className="space-y-8">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Picture</h2>
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-aidora-green to-emerald-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                    {previewUrl ? <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" /> : <FiUser size={64} className="text-white" />}
                  </div>
                  <label
                    htmlFor="profilePictureInput"
                    className="absolute bottom-0 right-0 bg-aidora-green hover:bg-emerald-600 text-white rounded-full p-3 cursor-pointer shadow-lg transform hover:scale-110 transition-transform"
                  >
                    <FiCamera size={20} />
                  </label>
                </div>
                <input id="profilePictureInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">JPG, PNG, GIF - Max 5MB</p>
                {previewUrl && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Remove Photo
                  </motion.button>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Account Type:</strong> {isProvider ? 'Service Provider' : user.role === 'admin' ? 'Admin' : 'Service User'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-aidora-green to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiSave size={20} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      city: user?.city || '',
                      address: user?.address || '',
                      profilePicture: null,
                    });
                    setPreviewUrl(user?.profilePicture || null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'provider' && isProvider && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Provider Profile</h2>
                <p className="text-gray-600 dark:text-gray-400">Showcase your expertise and availability</p>
              </div>
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">{user.providerProfile?.verificationStatus || 'pending'}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Bio</label>
                <textarea
                  value={providerForm.bio}
                  onChange={(e) => setProviderForm({ ...providerForm, bio: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  placeholder="Describe your expertise"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Skills (comma separated)</label>
                <input
                  value={providerForm.skills}
                  onChange={(e) => setProviderForm({ ...providerForm, skills: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Hourly Rate (TND)</label>
                <input
                  type="number"
                  min="0"
                  value={providerForm.hourlyRate}
                  onChange={(e) => setProviderForm({ ...providerForm, hourlyRate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Services Offered (one per line: title | price)</label>
                <textarea
                  value={providerForm.servicesOffered}
                  onChange={(e) => setProviderForm({ ...providerForm, servicesOffered: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  placeholder="Service title | 80"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Listed services appear on your provider card.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Availability</label>
                <input
                  value={providerForm.availabilityNote}
                  onChange={(e) => setProviderForm({ ...providerForm, availabilityNote: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  placeholder="Mon-Fri 9h-18h"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Services Preview</label>
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900 text-sm space-y-1 h-full min-h-[120px]">
                  {servicesList.length === 0 && <p className="text-gray-500">No services listed yet.</p>}
                  {servicesList.map((s) => (
                    <div key={s.title} className="flex justify-between">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{s.title}</span>
                      {s.price !== undefined && <span className="text-gray-600 dark:text-gray-300">{s.price} TND</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={saveProvider}
                disabled={savingProvider}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProvider ? 'Saving...' : 'Save Provider Profile'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setProviderForm({
                  bio: user.providerProfile?.bio || '',
                  skills: (user.providerProfile?.skills || []).join(', '),
                  servicesOffered: (user.providerProfile?.servicesOffered || [])
                    .map((s) => `${s.title}${s.price ? ` | ${s.price}` : ''}`)
                    .join('\n'),
                  hourlyRate: user.providerProfile?.hourlyRate ?? '',
                  availabilityNote: user.providerProfile?.availabilityNote || '',
                })}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold"
              >
                Reset
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  minLength={6}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={savingPrefs}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <FiLock size={18} />
                {savingPrefs ? 'Updating...' : 'Update Password'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={savePreferences}
                disabled={savingPrefs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {savingPrefs ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
            {[{ key: 'emailNotifications', title: 'Email Notifications', desc: 'Booking updates and receipts' },
              { key: 'smsNotifications', title: 'SMS Notifications', desc: 'Urgent alerts via text' },
              { key: 'pushNotifications', title: 'Push Notifications', desc: 'Browser alerts for real-time updates' },
              { key: 'bookingReminders', title: 'Booking Reminders', desc: 'Reminders before a booking starts' },
              { key: 'productUpdates', title: 'Product Updates', desc: 'Release notes and new features' }].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(item.key)}
                  className={`relative w-14 h-8 rounded-full transition ${notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition transform ${notifications[item.key] ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h2>
                <p className="text-gray-600 dark:text-gray-400">Language, currency, theme, and units</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={savePreferences}
                disabled={savingPrefs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {savingPrefs ? 'Saving...' : 'Save'}
              </motion.button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FiGlobe /> Language</h3>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Currency</h3>
                <select
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Time Zone</h3>
                <select
                  value={preferences.timeZone}
                  onChange={(e) => setPreferences({ ...preferences, timeZone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Distance Units</h3>
                <select
                  value={preferences.distanceUnit}
                  onChange={(e) => setPreferences({ ...preferences, distanceUnit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {DISTANCE_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Theme</h3>
                <div className="flex gap-2">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setPreferences({ ...preferences, theme })}
                      className={`px-4 py-2 rounded-lg border ${preferences.theme === theme ? 'border-blue-600 text-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                    >
                      {theme.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FiShield className="text-blue-600" />
              Admin Settings
            </h2>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FiShield size={18} />
                  Platform Status
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">All systems operational</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Default Commission Rate</h4>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">10%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Platform fee for each booking</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Currency</h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">TND</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tunisian Dinar</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Admin Access Level</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">You have full administrative access to all platform features including user management, service management, booking oversight, and commission control.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
