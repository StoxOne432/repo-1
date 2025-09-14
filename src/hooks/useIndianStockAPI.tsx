import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingStock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume?: string;
  high?: number;
  low?: number;
}

export interface SearchStock {
  symbol: string;
  name: string;
  companyName: string;
  currentPrice: {
    BSE: string;
    NSE: string;
  };
  percentChange: string;
  industry?: string;
  marketCap?: string;
}

export function useIndianStockAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingStocks = useCallback(async (): Promise<TrendingStock[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('indian-stock-api/trending');
      console.log("trending Data", data);
      console.log("error", error)
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to fetch trending stocks');
      }

      // Handle different response formats from the API
      const stocks = Array.isArray(data) ? data : data?.data || data?.stocks || [];
      
      // Transform the data to match our interface
      return stocks.map((stock: any) => ({
        symbol: stock.symbol || stock.Symbol || '',
        name: stock.name || stock.Name || stock.company_name || '',
        ltp: parseFloat(stock.ltp || stock.LTP || stock.price || stock.Price || 0),
        change: parseFloat(stock.change || stock.Change || stock.net_change || 0),
        changePercent: parseFloat(stock.changePercent || stock.ChangePercent || stock.percent_change || 0),
        volume: stock.volume || stock.Volume || '',
        high: parseFloat(stock.high || stock.High || 0),
        low: parseFloat(stock.low || stock.Low || 0),
      }));
    } catch (err: any) {
      console.error('Error fetching trending stocks:', err);
      setError(err.message || 'Failed to fetch trending stocks');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchStocks = useCallback(async (query: string): Promise<SearchStock[]> => {
    if (!query.trim()) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the search results from industry_search
      const { data: searchData, error: searchError } = await supabase.functions.invoke(`indian-stock-api/search?query=${encodeURIComponent(query)}`);

      if (searchError) {
        console.error('Supabase function error:', searchError);
        throw new Error(searchError.message || 'Failed to search stocks');
      }

      // Handle different response formats from the API
      const searchResults = Array.isArray(searchData) ? searchData : searchData?.data || searchData?.results || [];
      
      if (searchResults.length === 0) {
        return [];
      }

      // For each search result, get detailed stock data
      const detailedStocks = await Promise.all(
        searchResults.map(async (stock: any) => {
          try {
            const stockName = stock.commonName || stock.name || stock.Name || stock.company_name || '';
            if (!stockName) return null;

            const { data: stockData, error: stockError } = await supabase.functions.invoke(`indian-stock-api/stock?name=${encodeURIComponent(stockName)}`);

            if (stockError || !stockData) {
              console.warn(`Failed to get details for ${stockName}:`, stockError);
              return null;
            }

            return {
              symbol: stock.symbol || stock.Symbol || stockName.replace(/\s+/g, '').toUpperCase(),
              name: stockName,
              companyName: stockData.companyName || stockName,
              currentPrice: stockData.currentPrice || { BSE: '0', NSE: '0' },
              percentChange: stockData.percentChange || '0',
              industry: stock.industry || stock.Industry || stock.sector || '',
              marketCap: stock.marketCap || stock.MarketCap || stock.market_cap || '',
            };
          } catch (err) {
            console.warn(`Error fetching details for stock:`, err);
            return null;
          }
        })
      );

      // Filter out null results
      return detailedStocks.filter((stock): stock is SearchStock => stock !== null);
    } catch (err: any) {
      console.error('Error searching stocks:', err);
      setError(err.message || 'Failed to search stocks');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchTrendingStocks,
    searchStocks,
    isLoading,
    error,
  };
}