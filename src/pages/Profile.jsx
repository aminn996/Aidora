import { useEffect, useState } from 'react';
import { FiSave, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ display_name: '', phone_number: '', country: '', region: '', city: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.profile) return;
    setForm({
      display_name: user.profile.display_name || user.name || '',
      phone_number: user.profile.phone_number || '',
      country: user.profile.country || '',
      region: user.profile.region || '',
      city: user.profile.city || '',
      bio: user.profile.bio || '',
    });
  }, [user]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error.message || 'Could not update your profile.');
    } finally { setSaving(false); }
  };

  if (!user) return null;
  return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Account profile</p><h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Your profile</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Keep your contact details and service location up to date.</p></div><form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8"><div className="mb-8 flex items-center gap-4"><div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><FiUser size={28} /></div><div><p className="font-semibold text-slate-950 dark:text-white">{user.email}</p><p className="text-sm capitalize text-slate-500">{user.role} account</p></div></div><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Display name<input name="display_name" value={form.display_name} onChange={update} className={`${inputClass} mt-2`} required /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Phone number<input name="phone_number" value={form.phone_number} onChange={update} className={`${inputClass} mt-2`} /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Country<input name="country" value={form.country} onChange={update} className={`${inputClass} mt-2`} /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Region<input name="region" value={form.region} onChange={update} className={`${inputClass} mt-2`} /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">City<input name="city" value={form.city} onChange={update} className={`${inputClass} mt-2`} /></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">Bio<textarea name="bio" value={form.bio} onChange={update} rows={4} className={`${inputClass} mt-2`} placeholder="Tell the Aidora community a little about you." /></label></div><button type="submit" disabled={saving} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"><FiSave />{saving ? 'Saving…' : 'Save profile'}</button></form></main>;
}
