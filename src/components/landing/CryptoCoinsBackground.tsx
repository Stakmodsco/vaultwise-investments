import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import bg1 from '@/assets/crypto-coins-bg-1.jpg';
import bg2 from '@/assets/crypto-coins-bg-2.jpg';
import bg3 from '@/assets/crypto-coins-bg-3.jpg';

const slides = [bg1, bg2, bg3];

const CryptoCoinsBackground = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slides[index]})` }}
        />
      </AnimatePresence>
      {/* Dark gradient overlay so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
};

export default CryptoCoinsBackground;
