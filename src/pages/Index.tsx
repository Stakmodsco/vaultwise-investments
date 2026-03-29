import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import VaultPreview from '@/components/landing/VaultPreview';
import Disclaimer from '@/components/landing/Disclaimer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <VaultPreview />
      <Disclaimer />
    </div>
  );
};

export default Index;
