import { useEffect, useState } from 'react';
import { FiHeart, FiClipboard, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../services/supabase.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(null);
  const [favoriteCount, setFavoriteCount] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    Promise.all([
      supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('customer_id', user.id),
      supabase.from('favorites').select('provider_id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([requests, favorites]) => {
      if (!active) return;
      setRequestCount(requests.count ?? 0);
      setFavoriteCount(favorites.count ?? 0);
    });
    return () => { active = false; };
  }, [user?.id]);

  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aidora-green">Customer dashboard</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'there'}</h1>
    <p className="mt-2 text-slate-600 dark:text-slate-400">Find trusted help and keep your service requests in one place.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Metric icon={FiClipboard} label="My requests" value={requestCount} href="/bookings" />
      <Metric icon={FiHeart} label="Favorites" value={favoriteCount} href="/services" />
      <Metric icon={FiUser} label="Profile" value="Edit" href="/profile" />
    </div>
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold">Ready to find help?</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Browse available professionals and discover the right service for you.</p>
      <Link to="/services" className="mt-5 inline-flex rounded-xl bg-aidora-green px-5 py-3 font-semibold text-white hover:bg-emerald-600">Explore services</Link>
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, href }) {
  return <Link to={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><Icon className="text-aidora-green" size={22} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value === null ? '—' : value}</p></Link>;
}
