import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Icon3D from '@/components/ui/Icon3D';
import { Diamond, Flame, Crown } from 'lucide-react';
import { type AchievementId, achievementMeta } from '@/lib/leaderboard';

const iconMap = {
  'diamond-hands': Diamond,
  'hot-streak': Flame,
  'vault-master': Crown,
} as const;

interface AchievementBadgeProps {
  id: AchievementId;
  size?: 'sm' | 'md';
}

const AchievementBadge = ({ id, size = 'sm' }: AchievementBadgeProps) => {
  const meta = achievementMeta[id];
  const Icon = iconMap[id];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="transition-transform duration-200 hover:scale-110 hover:-translate-y-0.5 cursor-help">
            <Icon3D icon={Icon} variant={meta.variant} size={size} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-display text-xs font-bold text-foreground">{meta.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;
