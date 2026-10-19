import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('We could not send the reset email. Please try again.');
      return;
    }
    setSent(true);
    toast.success('Check your email for a secure reset link.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600"><FiArrowLeft /> Back</button>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Reset your password</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send a secure reset link.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email
            <div className="relative mt-2"><FiMail className="absolute left-3 top-3.5 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="you@example.com" /></div>
          </label>
          <button disabled={loading} className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">{loading ? 'Sending…' : 'Send reset link'}</button>
        </form>
        {sent && <div className="mt-5 flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><FiCheckCircle className="mt-0.5 shrink-0" /> If an account exists, reset instructions are on their way.</div>}
        <p className="mt-6 text-center text-sm text-slate-500">Remembered it? <Link to="/login" className="font-semibold text-emerald-600">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
