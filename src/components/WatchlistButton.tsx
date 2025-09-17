import { Button } from '@/components/ui/button';
import { Heart, HeartIcon } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';

interface WatchlistButtonProps {
  symbol: string;
  name: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const WatchlistButton = ({ 
  symbol, 
  name, 
  variant = 'outline', 
  size = 'sm' 
}: WatchlistButtonProps) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(symbol);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol, name);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-1 ${
        inWatchlist 
          ? 'text-primary border-primary hover:bg-primary/10' 
          : 'text-muted-foreground hover:text-primary'
      }`}
    >
      {inWatchlist ? (
        <Heart className="h-4 w-4 fill-current" />
      ) : (
        <HeartIcon className="h-4 w-4" />
      )}
      {size !== 'icon' && (
        <span className="text-xs">
          {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </span>
      )}
    </Button>
  );
};