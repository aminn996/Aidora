import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiSearch, FiGrid, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useDarkMode } from '../context/DarkModeContext.jsx';
import Logo from '../components/Logo.jsx';
import DarkModeToggle from '../components/DarkModeToggle.jsx';

const navItems = [{ label: 'Find help', href: '/services' }, { label: 'How Aidora works', href: '/#how-it-works' }];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  const linkClass = ({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'}`;

  return <motion.header initial={{ y: -80 }} animate={{ y: 0 }} className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
      <Link to="/" onClick={close} aria-label="Aidora home"><Logo size="md" showText /></Link>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">{navItems.map((item) => <NavLink key={item.href} to={item.href} className={linkClass}>{item.label}</NavLink>)}</nav>
      <div className="hidden items-center gap-3 md:flex"><Link to="/services" className="flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800" aria-label="Search"><FiSearch /></Link><DarkModeToggle />{isAuthenticated ? <><Link to={user?.role === 'admin' ? '/admin' : user?.role === 'provider' ? '/provider' : '/profile'} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"><span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>{user?.name || 'Account'}</Link><button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><FiLogOut /> Log out</button></> : <><Link to="/login" className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 dark:text-slate-200">Log in</Link><Link to="/register" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">Get started</Link></>}</div>
      <div className="flex items-center gap-2 md:hidden"><DarkModeToggle /><button onClick={() => setIsOpen((open) => !open)} className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800" aria-label={isOpen ? 'Close menu' : 'Open menu'}>{isOpen ? <FiX size={22} /> : <FiMenu size={22} />}</button></div>
    </div>
    {isOpen && <div className="border-t border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-950 md:hidden"><nav className="flex flex-col gap-4">{navItems.map((item) => <NavLink key={item.href} to={item.href} onClick={close} className={linkClass}>{item.label}</NavLink>)}<Link to="/services" onClick={close} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><FiGrid /> Browse all services</Link><div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">{isAuthenticated ? <><Link to="/profile" onClick={close} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold dark:border-slate-700">Profile</Link><button onClick={() => { logout(); close(); }} className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">Log out</button></> : <><Link to="/login" onClick={close} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold dark:border-slate-700">Log in</Link><Link to="/register" onClick={close} className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white">Get started</Link></>}</div></nav></div>}
  </motion.header>;
}
