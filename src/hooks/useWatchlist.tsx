import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIndianStockAPI } from './useIndianStockAPI';

export interface WatchlistItem {
  id: string;
  stock_symbol: string;
  stock_name: string;
  added_at: string;
  current_price?: number;
  percent_change?: string;
  net_change?: string;
}

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { searchStocks } = useIndianStockAPI();

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Fetch current prices for watchlist items
      const watchlistWithPrices = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const stockData = await searchStocks(item.stock_symbol);
            if (stockData && stockData.length > 0) {
              const stock = stockData[0];
              return {
                ...item,
                current_price: parseFloat(stock.currentPrice.NSE || stock.currentPrice.BSE || '0'),
                percent_change: stock.percentChange,
                net_change: (parseFloat(stock.percentChange || '0') * parseFloat(stock.currentPrice.NSE || stock.currentPrice.BSE || '0') / 100).toFixed(2)
              };
            }
            return item;
          } catch (error) {
            console.error(`Error fetching price for ${item.stock_symbol}:`, error);
            return item;
          }
        })
      );

      setWatchlist(watchlistWithPrices);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to fetch watchlist",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to add stocks to watchlist",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: user.id,
          stock_symbol: symbol,
          stock_name: name
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already in Watchlist",
            description: `${symbol} is already in your watchlist`,
            variant: "default"
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Added to Watchlist",
        description: `${symbol} has been added to your watchlist`,
        variant: "default"
      });

      fetchWatchlist(); // Refresh the watchlist
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_symbol', symbol);

      if (error) throw error;

      toast({
        title: "Removed from Watchlist",
        description: `${symbol} has been removed from your watchlist`,
        variant: "default"
      });

      fetchWatchlist(); // Refresh the watchlist
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive"
      });
      return false;
    }
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some(item => item.stock_symbol === symbol);
  };

  const refreshWatchlist = () => {
    fetchWatchlist();
  };

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refreshWatchlist
  };
};