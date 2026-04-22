import { Lock, ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccountStatus } from '@/lib/account-status-context';

const AccountStatusBanner = () => {
  const { status, isLocked, isBlacklisted } = useAccountStatus();
  if (!status || (!isLocked && !isBlacklisted)) return null;

  return (
    <div className={`fixed top-[60px] left-0 right-0 z-40 ${isBlacklisted ? 'bg-destructive' : 'bg-amber-600'} text-white`}>
      <div className="container mx-auto flex items-center justify-between gap-3 px-6 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          {isBlacklisted ? <ShieldOff size={16} /> : <Lock size={16} />}
          <span className="font-semibold">
            {isBlacklisted
              ? `Account suspended${status.blacklist_reason ? `: ${status.blacklist_reason}` : ''}`
              : 'Account locked — too many failed identity checks'}
          </span>
        </div>
        <Link to="/support" className="rounded-md bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25">
          Contact support
        </Link>
      </div>
    </div>
  );
};

export default AccountStatusBanner;
