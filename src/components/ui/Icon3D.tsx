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

const sizeMap: Record<Icon3DSize, { container: string; icon: number }> = {
  sm: { container: 'w-8 h-8', icon: 14 },
  md: { container: 'w-10 h-10', icon: 18 },
  lg: { container: 'w-12 h-12', icon: 22 },
  xl: { container: 'w-16 h-16', icon: 28 },
};

const variantClass: Record<Icon3DVariant, string> = {
  blue: 'icon-3d-blue',
  green: 'icon-3d-green',
  red: 'icon-3d-red',
  purple: 'icon-3d-purple',
  teal: 'icon-3d-teal',
  amber: 'icon-3d-amber',
  default: 'icon-3d',
};

const Icon3D = ({ icon: IconComponent, variant = 'default', size = 'md', className = '', animate = false }: Icon3DProps) => {
  const { container, icon: iconSize } = sizeMap[size];

  return (
    <div
      className={`${container} ${variantClass[variant]} ${animate ? 'transition-transform duration-300 hover:scale-110 hover:rotate-3' : ''} ${className}`}
    >
      <IconComponent
        size={iconSize}
        className="drop-shadow-sm"
        strokeWidth={2}
        color="white"
      />
    </div>
  );
};

export default Icon3D;
