import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    bio: '',
    skills: '',
    servicesOffered: '',
    hourlyRate: '',
    availabilityNote: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      city: user.city || '',
      address: user.address || '',
      bio: user.providerProfile?.bio || '',
      skills: (user.providerProfile?.skills || []).join(', '),
      servicesOffered: (user.providerProfile?.servicesOffered || [])
        .map((s) => `${s.title}${s.price ? ` | ${s.price}` : ''}`)
        .join('\n'),
      hourlyRate: user.providerProfile?.hourlyRate || '',
      availabilityNote: user.providerProfile?.availabilityNote || '',
    });
  }, [user]);

  if (!user) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        city: form.city,
        address: form.address,
      };

      if (form.bio) payload.bio = form.bio;
      if (form.skills) payload.skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (form.servicesOffered) {
        payload.servicesOffered = form.servicesOffered
          .split('\n')
          .map((line) => {
            const [title, price] = line.split('|').map((p) => p && p.trim());
            if (!title) return null;
            return { title, price: price ? Number(price) : undefined };
          })
          .filter(Boolean);
      }
      if (form.hourlyRate !== '') payload.hourlyRate = Number(form.hourlyRate);
      if (form.availabilityNote) payload.availabilityNote = form.availabilityNote;

      const res = await updateProfile(payload);
      setMessage(res.message || 'Profile updated');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Profile</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Update your account details</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input value={user.email} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {user.role === 'provider' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Skills (comma separated)</label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Services Offered (one per line: title | price)</label>
              <textarea
                name="servicesOffered"
                rows={4}
                value={form.servicesOffered}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                placeholder="Plumbing repair | 80\nElectrical check | 60"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Hourly Rate (TND)</label>
                <input
                  name="hourlyRate"
                  type="number"
                  min="0"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Availability</label>
                <input
                  name="availabilityNote"
                  value={form.availabilityNote}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  placeholder="Mon-Fri 9h-18h"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {message && <span className="text-sm text-gray-600 dark:text-gray-300">{message}</span>}
        </div>
      </form>
    </div>
  );
}
