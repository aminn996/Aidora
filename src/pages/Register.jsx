import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

const passwordScore = (value) => [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value)].filter(Boolean).length;

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: searchParams.get('role') || 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const score = passwordScore(form.password);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (score < 2) return setError('Use at least 8 characters, one uppercase letter, and one number.');
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not create your account. Please try again.');
    } finally { setLoading(false); }
  };

  const googleSignup = async () => {
    try {
      await googleLogin();
    } catch (err) {
      toast.error('Google sign-up is unavailable right now. Please try again.');
    }
  };

  return <main className="min-h-screen bg-[#f6f8f7] px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden rounded-[2rem] bg-aidora-dark p-10 text-white lg:block">
        <Logo light />
        <div className="mt-24 max-w-md"><p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-aidora-green">A better way to get help</p><h1 className="text-5xl font-bold leading-tight">Find trusted help, wherever life takes you.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Discover trusted professionals, request services, and find help wherever you are.</p></div>
        <div className="mt-24 grid grid-cols-3 gap-3 text-center text-sm text-slate-300"><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl text-white">10k+</strong>professionals</div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl text-white">4.9</strong>average rating</div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl text-white">24/7</strong>support</div></div>
      </section>
      <section className="mx-auto w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60 dark:bg-slate-900 dark:shadow-black/20 sm:p-10">
        <div className="mb-8 lg:hidden"><Logo /></div><p className="text-sm font-semibold text-aidora-green">JOIN AIDORA</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Create your Aidora account</h2><p className="mt-2 text-slate-500 dark:text-slate-400">One account for finding help and growing your professional business.</p>
        <button type="button" onClick={googleSignup} className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 font-semibold transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><span className="text-lg font-bold text-[#4285f4]">G</span> Continue with Google</button>
        <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />or continue with email<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
        <form onSubmit={onSubmit} className="space-y-4">
          {[['name','Full name',FiUser,'Alex Morgan'],['email','Email address',FiMail,'you@example.com']].map(([key,label,Icon,placeholder]) => <label key={key} className="block text-sm font-medium">{label}<span className="ml-1 text-aidora-green">*</span><div className="relative mt-2"><Icon className="absolute left-4 top-3.5 text-slate-400" /><input aria-label={label} required type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={update(key)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-200 bg-transparent pl-11 pr-4 outline-none transition focus:border-aidora-green focus:ring-4 focus:ring-aidora-green/10 dark:border-slate-700" /></div></label>)}
          <label className="block text-sm font-medium">Password<span className="ml-1 text-aidora-green">*</span><div className="relative mt-2"><FiLock className="absolute left-4 top-3.5 text-slate-400" /><input required minLength="8" aria-label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} className="h-12 w-full rounded-xl border border-slate-200 bg-transparent pl-11 pr-12 outline-none focus:border-aidora-green focus:ring-4 focus:ring-aidora-green/10 dark:border-slate-700" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-3 p-1 text-slate-400">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div><div className="mt-2 flex gap-1">{[0,1,2].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${score > item ? 'bg-aidora-green' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div></label>
          <label className="block text-sm font-medium">Confirm password<div className="relative mt-2"><FiLock className="absolute left-4 top-3.5 text-slate-400" /><input required aria-label="Confirm password" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} className="h-12 w-full rounded-xl border border-slate-200 bg-transparent pl-11 pr-4 outline-none focus:border-aidora-green focus:ring-4 focus:ring-aidora-green/10 dark:border-slate-700" /></div></label>
          <div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={form.role === 'user'} onChange={() => setForm((v) => ({ ...v, role: 'user' }))} /> Find a professional</label><label className="flex items-center gap-2"><input type="radio" checked={form.role === 'provider'} onChange={() => setForm((v) => ({ ...v, role: 'provider' }))} /> Offer services</label></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-aidora-green font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Creating account…' : 'Create account'} {!loading && <FiArrowRight />}</button>
        </form><p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-aidora-green hover:underline" to="/login">Sign in</Link></p>
      </section>
    </div>
  </main>;
}
