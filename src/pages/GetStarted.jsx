import { FiBriefcase, FiSearch, FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function GetStarted() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const continueAs = (intent) => {
    if (user) {
      if (intent === 'provider') {
        navigate(user.role === 'provider' || user.role === 'admin' ? '/provider/dashboard' : '/provider/onboarding');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    navigate(`/register?intent=${intent}`);
  };

  return (
    <main className="min-h-screen bg-[#f6f8f7] px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center"><Logo /></div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aidora-green">WELCOME TO AIDORA</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Get started with Aidora</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">How would you like to use Aidora?</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ChoiceCard icon={FiSearch} eyebrow="I need a service" title="Find a Service" description="Discover professionals and services near you." button="Find a Service" onClick={() => continueAs('customer')} />
          <ChoiceCard icon={FiBriefcase} eyebrow="I offer a service" title="Offer a Service" description="Create your professional profile and offer your services on Aidora." button="Become a Provider" onClick={() => continueAs('provider')} featured />
        </div>
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link className="font-semibold text-aidora-green hover:underline" to="/login">Log in</Link></p>
      </div>
    </main>
  );
}

function ChoiceCard({ icon: Icon, eyebrow, title, description, button, onClick, featured }) {
  return (
    <section className={`rounded-[2rem] border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 sm:p-10 ${featured ? 'border-aidora-green/40' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${featured ? 'bg-aidora-green text-white' : 'bg-slate-100 text-aidora-green dark:bg-slate-800'}`}><Icon size={27} aria-hidden="true" /></div>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-aidora-green">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold">{title}</h2>
      <p className="mt-4 min-h-14 leading-7 text-slate-600 dark:text-slate-400">{description}</p>
      <button type="button" onClick={onClick} className={`mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold transition ${featured ? 'bg-aidora-green text-white hover:bg-emerald-600' : 'border border-slate-300 text-slate-900 hover:border-aidora-green hover:text-aidora-green dark:border-slate-700 dark:text-white'}`}>{button}<FiArrowRight /></button>
    </section>
  );
}
