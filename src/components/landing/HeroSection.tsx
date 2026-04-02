import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
            Win Smarter.
            <span className="text-accent block">Bet Better.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Get access to expert predictions, real-time updates, and a powerful platform
            designed to maximize your winning potential.
          </p>
          <div className="flex gap-4">
            <Link
              to="/dashboard"
              className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Get Started
            </Link>
            <Link
              to="/vaults"
              className="border border-border px-6 py-3 rounded-xl hover:bg-secondary transition text-foreground"
            >
              Learn More
            </Link>
          </div>
        </motion.div>

        {/* RIGHT CONTENT */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xl font-display font-semibold mb-4">Today's Hot Picks</h3>
            <div className="space-y-4">
              {[
                { match: 'Arsenal vs Chelsea', odds: '2.15' },
                { match: 'Man City vs Liverpool', odds: '1.85' },
                { match: 'Barcelona vs Madrid', odds: '2.40' },
              ].map((pick) => (
                <motion.div
                  key={pick.match}
                  whileHover={{ scale: 1.02 }}
                  className="flex justify-between bg-card p-4 rounded-xl transition-colors"
                >
                  <span className="text-foreground">{pick.match}</span>
                  <span className="text-accent font-bold">{pick.odds}</span>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Glow Effect */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent opacity-20 blur-3xl rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
