import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiMapPin, FiSearch, FiShield, FiStar, FiUsers, FiZap } from 'react-icons/fi';
import Logo from '../components/Logo.jsx';
import useGeolocation from '../hooks/useGeolocation';
import { MARKET_CONFIG } from '../config/marketplace.js';

const trustPoints = [
  { icon: FiShield, title: 'Trusted professionals', text: 'Profiles, reviews, and verification signals help you choose with confidence.' },
  { icon: FiMapPin, title: 'Location-aware matching', text: 'Discover relevant help in your city, wherever you are in the world.' },
  { icon: FiZap, title: 'Simple from start to finish', text: 'Search, compare, request, and keep every conversation in one place.' },
];

export default function Home() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState(MARKET_CONFIG.defaultCountry.code);

  const selectedCountry = useMemo(
    () => MARKET_CONFIG.countries.find((item) => item.code === country) || MARKET_CONFIG.defaultCountry,
    [country],
  );

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (service.trim()) params.set('search', service.trim());
    if (location.trim()) params.set('location', location.trim());
    params.set('country', selectedCountry.code);
    if (geo.coords) {
      params.set('lat', geo.coords.lat);
      params.set('lng', geo.coords.lng);
    }
    navigate(`/services?${params.toString()}`);
  }

  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-[#102a43] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,187,120,0.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(66,153,225,0.24),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-emerald-300"><Logo size="sm" showText /> <span className="rounded-full border border-white/20 px-3 py-1">Local help, anywhere</span></div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">Find the right professional near you.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200">Discover trusted local professionals and get the help you need, wherever you are.</p>
            <form onSubmit={submitSearch} className="mt-10 rounded-2xl bg-white p-3 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_auto]">
                <label className="flex min-h-14 items-center gap-3 rounded-xl bg-slate-50 px-4"><FiSearch className="text-emerald-600" /><span className="sr-only">Service</span><input value={service} onChange={(event) => setService(event.target.value)} placeholder="What do you need?" className="w-full border-0 bg-transparent outline-none placeholder:text-slate-400" /></label>
                <label className="flex min-h-14 items-center gap-3 rounded-xl bg-slate-50 px-4"><FiMapPin className="text-emerald-600" /><span className="sr-only">Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or location" className="w-full border-0 bg-transparent outline-none placeholder:text-slate-400" /></label>
                <label className="flex min-h-14 items-center rounded-xl bg-slate-50 px-4"><span className="sr-only">Country</span><select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full border-0 bg-transparent outline-none"><option value="">Country</option>{MARKET_CONFIG.countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
                <button className="min-h-14 rounded-xl bg-emerald-500 px-6 font-semibold text-white transition hover:bg-emerald-600" type="submit">Find help <FiArrowRight className="ml-2 inline" /></button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500"><button type="button" onClick={() => geo.refresh?.()} className="font-semibold text-slate-700 hover:text-emerald-600"><FiMapPin className="mr-1 inline" /> Use my current location</button><span>Popular: plumber, cleaner, computer repair</span></div>
            </form>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm text-slate-300">A better way to get things done</p><h2 className="mt-1 text-2xl font-semibold">Built around trust</h2></div><Logo size="lg" showText={false} /></div>
            <div className="grid gap-4 pt-6 sm:grid-cols-2"><div className="rounded-2xl bg-white/10 p-5"><FiUsers className="text-emerald-300" /><p className="mt-8 text-3xl font-semibold">25+</p><p className="text-sm text-slate-300">cities ready to grow</p></div><div className="rounded-2xl bg-white/10 p-5"><FiStar className="text-amber-300" /><p className="mt-8 text-3xl font-semibold">4.8/5</p><p className="text-sm text-slate-300">community rating</p></div></div>
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-200"><span className="flex size-8 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"><FiCheck /></span> A global platform that started in Tunisia.</div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">One trusted place</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Whatever you need, there is someone nearby who can help.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{trustPoints.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon /></div><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></div>)}</div></section>

      <section className="bg-white"><div className="mx-auto max-w-7xl px-6 py-20 lg:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Explore by need</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Start with a category</h2></div><Link to="/services" className="font-semibold text-emerald-700">View all services <FiArrowRight className="ml-1 inline" /></Link></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{MARKET_CONFIG.categories.map((category) => <Link key={category.slug} to={`/services?category=${encodeURIComponent(category.name)}`} className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"><div className="flex items-center justify-between"><h3 className="font-semibold">{category.name}</h3><FiArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" /></div><p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p></Link>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8"><div className="rounded-[2rem] bg-emerald-500 px-7 py-10 text-white sm:px-12 sm:py-14"><div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center"><div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to get started?</h2><p className="mt-3 max-w-xl text-emerald-50">Join people finding reliable help and professionals building their reputation on Aidora.</p></div><div className="flex flex-wrap gap-3"><Link to="/register" className="rounded-xl bg-white px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">Create an account</Link><Link to="/register?role=provider" className="rounded-xl border border-white/50 px-5 py-3 font-semibold hover:bg-white/10">Become a provider</Link></div></div></div></section>
    </div>
  );
}
