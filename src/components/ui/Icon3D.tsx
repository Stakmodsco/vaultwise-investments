import { type LucideIcon } from 'lucide-react';

type Icon3DVariant = 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'amber' | 'default';
type Icon3DSize = 'sm' | 'md' | 'lg' | 'xl';

interface Icon3DProps {
  icon: LucideIcon;
  variant?: Icon3DVariant;
  size?: Icon3DSize;
  className?: string;
  animate?: boolean;
}

const sizeMap: Record<Icon3DSize, { container: string; icon: number; radius: string }> = {
  sm: { container: 'w-9 h-9', icon: 16, radius: 'rounded-xl' },
  md: { container: 'w-11 h-11', icon: 20, radius: 'rounded-xl' },
  lg: { container: 'w-13 h-13', icon: 24, radius: 'rounded-2xl' },
  xl: { container: 'w-16 h-16', icon: 28, radius: 'rounded-2xl' },
};

const variantStyles: Record<Icon3DVariant, { bg: string; shadow: string; ring: string }> = {
  blue: {
    bg: 'bg-gradient-to-br from-[hsl(217,90%,58%)] to-[hsl(217,100%,42%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(217,100%,50%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  green: {
    bg: 'bg-gradient-to-br from-[hsl(142,71%,52%)] to-[hsl(142,71%,36%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(142,71%,45%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  red: {
    bg: 'bg-gradient-to-br from-[hsl(0,84%,62%)] to-[hsl(0,84%,44%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(0,84%,55%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  purple: {
    bg: 'bg-gradient-to-br from-[hsl(258,90%,68%)] to-[hsl(258,90%,48%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(258,90%,55%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  teal: {
    bg: 'bg-gradient-to-br from-[hsl(168,100%,46%)] to-[hsl(168,100%,32%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(168,100%,40%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  amber: {
    bg: 'bg-gradient-to-br from-[hsl(43,96%,58%)] to-[hsl(43,96%,40%)]',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(43,96%,50%/0.4)]',
    ring: 'ring-1 ring-white/10',
  },
  default: {
    bg: 'bg-gradient-to-br from-secondary to-muted',
    shadow: 'shadow-[0_4px_14px_-2px_hsl(215,20%,15%/0.5)]',
    ring: 'ring-1 ring-white/5',
  },
};

const Icon3D = ({ icon: IconComponent, variant = 'default', size = 'md', className = '', animate = false }: Icon3DProps) => {
  const { container, icon: iconSize, radius } = sizeMap[size];
  const style = variantStyles[variant];

  return (
    <div
      className={`${container} ${radius} ${style.bg} ${style.shadow} ${style.ring} inline-flex items-center justify-center flex-shrink-0 ${animate ? 'transition-all duration-300 hover:scale-110 hover:-translate-y-0.5' : ''} ${className}`}
    >
      <IconComponent
        size={iconSize}
        className="drop-shadow-sm"
        strokeWidth={1.75}
        color="white"
      />
    </div>
  );
};

export default Icon3D;
