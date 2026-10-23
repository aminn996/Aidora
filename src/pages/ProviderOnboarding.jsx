import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const steps = ['Professional details', 'Location', 'Review'];

export default function ProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ businessName: '', category: 'Home & Maintenance', description: '', experience: '', country: '', city: '', serviceRadius: '25' });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (step < steps.length - 1) return setStep((current) => current + 1);
    if (!user?.id) return toast.error('Please sign in before continuing.');
    setSaving(true);
    try {
      const application = {
        user_id: user.id,
        category: form.category,
        description: form.description.trim(),
        business_name: form.businessName.trim(),
        experience: form.experience.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        service_radius: Number(form.serviceRadius) || 25,
        status: existing?.status || 'PENDING',
      };
      const { data: existing, error: lookupError } = await supabase.from('provider_applications').select('id, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      const query = existing?.id
        ? supabase.from('provider_applications').update({ ...application, updated_at: new Date().toISOString() }).eq('id', existing.id)
        : supabase.from('provider_applications').insert(application);
      const { error } = await query;
      if (error) throw error;
      toast.success('Your provider application was submitted for review.');
      navigate('/provider/onboarding');
    } catch (error) {
      toast.error(error.message || 'We could not submit your application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Provider onboarding</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Set up your professional profile</h1>
        <p className="mt-2 text-slate-600">Share the essentials first. You can refine your profile and add services from the provider dashboard.</p>
      </div>
      <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Onboarding progress">
        {steps.map((label, index) => <div key={label} className={`border-t-2 pt-2 text-xs font-semibold ${index <= step ? 'border-teal-600 text-teal-700' : 'border-slate-200 text-slate-400'}`}>{index + 1}. {label}</div>)}
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 0 && <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">Business or professional name<input required value={form.businessName} onChange={(e) => update('businessName', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label>Primary category<select value={form.category} onChange={(e) => update('category', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"><option>Home & Maintenance</option><option>Cleaning</option><option>Technology & Electronics</option><option>Education & Training</option><option>Health & Wellness</option><option>Business & Freelance</option></select></label>
          <label>Experience<input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="e.g. 5 years" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="sm:col-span-2">Short description<textarea required minLength={20} value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        </div>}
        {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
          <label>Country<input value={form.country} onChange={(e) => update('country', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label>City<input value={form.city} onChange={(e) => update('city', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label>Service radius (km)<input type="number" min="1" max="500" value={form.serviceRadius} onChange={(e) => update('serviceRadius', e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        </div>}
        {step === 2 && <div className="space-y-4 text-sm text-slate-700"><p><strong>{form.businessName}</strong> · {form.category}</p><p>{form.description}</p><p>{form.city || 'Location not specified'}{form.country ? `, ${form.country}` : ''} · {form.serviceRadius} km service area</p><p className="rounded-xl bg-amber-50 p-4 text-amber-900">Your application will remain pending until it is reviewed. You will be able to add services after approval.</p></div>}
        <div className="mt-8 flex justify-between gap-3"><button type="button" onClick={() => step ? setStep((current) => current - 1) : navigate('/')} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">{step ? 'Back' : 'Cancel'}</button><button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Submitting…' : step === steps.length - 1 ? 'Submit application' : 'Continue'}</button></div>
      </form>
    </section>
  );
}
