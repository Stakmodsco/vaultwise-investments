import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const INITIAL_PRICES: CoinPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67432.18, change24h: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.45, change24h: -0.87 },
  { symbol: 'SOL', name: 'Solana', price: 148.92, change24h: 5.12 },
  { symbol: 'BNB', name: 'BNB', price: 584.31, change24h: 1.03 },
];

const CryptoTicker = () => {
  const [prices, setPrices] = useState<CoinPrice[]>(INITIAL_PRICES);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev =>
        prev.map(coin => {
          const fluctuation = (Math.random() - 0.48) * 0.003;
          const newPrice = coin.price * (1 + fluctuation);
          const changeShift = (Math.random() - 0.5) * 0.2;
          return {
            ...coin,
            price: parseFloat(newPrice.toFixed(2)),
            change24h: parseFloat((coin.change24h + changeShift).toFixed(2)),
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-[57px] left-0 right-0 z-40 border-b border-border/40 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center gap-6 overflow-x-auto px-6 py-1.5 scrollbar-hide">
        <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live</span>
        <span className="h-3 w-px flex-shrink-0 bg-border/60" />
        {prices.map(coin => (
          <div key={coin.symbol} className="flex flex-shrink-0 items-center gap-2.5">
            <span className="text-xs font-semibold text-foreground">{coin.symbol}</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={coin.price}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-medium text-secondary-foreground tabular-nums"
              >
                ${coin.price.toLocaleString()}
              </motion.span>
            </AnimatePresence>
            <span
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                coin.change24h >= 0 ? 'text-vault-low' : 'text-destructive'
              }`}
            >
              {coin.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoTicker;
