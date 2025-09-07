import { Home, TrendingUp, User, Settings, Wallet } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { WalletDialog } from '@/components/WalletDialog';

export function MobileNavigation() {
  const location = useLocation();
  const { user, role } = useAuth();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: TrendingUp, label: 'Trading', path: '/trading' },
    { icon: Wallet, label: 'Wallet', action: 'wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
    ...(role === 'admin' ? [{ icon: Settings, label: 'Admin', path: '/admin' }] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.action === 'wallet') {
            return (
              <button
                key={item.label}
                onClick={() => setWalletDialogOpen(true)}
                className="flex flex-col items-center justify-center p-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <WalletDialog 
        open={walletDialogOpen} 
        onOpenChange={setWalletDialogOpen} 
      />
    </div>
  );
}