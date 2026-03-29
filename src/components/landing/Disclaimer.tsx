import { AlertTriangle } from 'lucide-react';
import Icon3D from '@/components/ui/Icon3D';

const Disclaimer = () => (
  <section className="border-t border-border px-6 py-16">
    <div className="container mx-auto flex max-w-3xl flex-col items-center text-center">
      <Icon3D icon={AlertTriangle} variant="amber" size="lg" className="mb-4" />
      <h3 className="mb-3 font-display text-lg font-semibold text-foreground">Important Disclaimer</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        VaultX is a simulated crypto investment platform for demonstration purposes.
        Returns are variable and based on market performance. Past performance does not guarantee future results.
        Cryptocurrency investments carry significant risk, including the potential loss of principal.
        This is not financial advice. Always do your own research before investing.
      </p>
    </div>
  </section>
);

export default Disclaimer;
