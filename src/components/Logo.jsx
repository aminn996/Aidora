import { motion } from 'framer-motion';

export default function Logo({ size = 'md', showText = false }) {
  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  };

  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2"
    >
      <motion.img
        src="/assets/aidora-logo.svg"
        alt="Aidora home"
        loading="eager"
        width={s}
        height={s}
        className="rounded-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {showText && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white"
        >
          Aidora
        </motion.span>
      )}
    </motion.div>
  );
}
