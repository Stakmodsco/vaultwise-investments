import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(prev => !prev)}
      className="relative rounded-xl bg-secondary/50 p-2.5 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
      aria-label="Toggle theme"
    >
      <motion.div
        key={dark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
