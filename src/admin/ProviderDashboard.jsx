import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClock, FiPlus, FiStar, FiTool, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const statusStyles = { PENDING: 'bg-amber-50 text-amber-700', ACCEPTED: 'bg-blue-50 text-blue-700', IN_PROGRESS: 'bg-violet-50 text-violet-700', COMPLETED: 'bg-emerald-50 text-emerald-700', REJECTED: 'bg-rose-50 text-rose-700', CANCELLED: 'bg-slate-100 text-slate-600' };

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: profile, error: profileError }, { data: serviceRows, error: serviceError }] = await Promise.all([
      supabase.from('provider_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('provider_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    ]);
    if (profileError || serviceError) { toast.error('We could not load your provider workspace.'); setLoading(false); return; }
    setProvider(profile);
    if (!serviceRows?.id) { setLoading(false); return; }
    const [{ data: ownedServices }, { data: requestRows }, { data: reviewRows }] = await Promise.all([
      supabase.from('services').select('*').eq('provider_id', serviceRows.id).order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*, services(title)').eq('provider_id', serviceRows.id).order('created_at', { ascending: false }).limit(8),
      supabase.from('reviews').select('*').eq('provider_id', serviceRows.id).order('created_at', { ascending: false }),
    ]);
    setServices(ownedServices || []); setRequests(requestRows || []); setReviews(reviewRows || []); setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0, [reviews]);
  const stats = [{ label: 'Active services', value: services.filter((item) => item.is_active).length, icon: FiTool }, { label: 'Pending requests', value: requests.filter((item) => item.status === 'PENDING').length, icon: FiClock }, { label: 'Completed services', value: requests.filter((item) => item.status === 'COMPLETED').length, icon: FiCheckCircle }, { label: 'Average rating', value: average ? average.toFixed(1) : '0', icon: FiStar }];
  async function updateRequest(id, status) { const { error } = await supabase.from('service_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id); if (error) toast.error(error.message); else { toast.success(`Request ${status.toLowerCase()}.`); load(); } }
  if (loading) return <div className="mx-auto max-w-7xl px-4 py-16 text-slate-500">Loading your provider workspace…</div>;
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Provider workspace</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Welcome back, {provider?.business_name || user?.profile?.display_name || 'provider'}</h1><p className="mt-2 text-slate-600">Manage services, requests, and your public presence.</p></div><Link to="/provider/services/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white"><FiPlus /> Add service</Link></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="text-teal-700" /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-950">{value}</p></div>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950">Recent requests</h2><Link to="/bookings" className="text-sm font-semibold text-teal-700">View all</Link></div>{requests.length ? <div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{request.services?.title || 'Service request'}</p><p className="text-sm text-slate-500">{request.preferred_at ? new Date(request.preferred_at).toLocaleString() : 'Date to be arranged'}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status] || statusStyles.PENDING}`}>{request.status}</span>{request.status === 'PENDING' && <><button onClick={() => updateRequest(request.id, 'ACCEPTED')} className="rounded-lg bg-teal-700 p-2 text-white" aria-label="Accept request"><FiCheckCircle /></button><button onClick={() => updateRequest(request.id, 'REJECTED')} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Reject request"><FiXCircle /></button></>}</div></div>)}</div> : <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-500">No requests yet. Keep your profile published to start receiving work.</div>}</section><aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Profile status</h2><div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="font-semibold">{provider?.verification_status || 'PENDING'}</p><p className="mt-1 text-sm text-slate-500">{provider?.is_published ? 'Your profile is visible to customers.' : 'Complete approval before publishing.'}</p></div><div className="mt-5 space-y-2 text-sm"><Link className="block rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50" to="/provider/services">Manage services</Link><Link className="block rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50" to="/provider/location">Location & service area</Link><Link className="block rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50" to="/provider/reviews">Reviews ({reviews.length})</Link></div></aside></div></div>;
}
