import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingStock {
  ticker_id: string;
  company_name: string;
  price: number;
  percent_change: number;
  net_change: number;
  volume?: string;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  category?: 'gainer' | 'loser';
  symbol: string; // For compatibility
  name: string; // For compatibility
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

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to fetch trending stocks');
      }

      // The API now returns a combined array of gainers and losers with category field
      const stocks = Array.isArray(data) ? data : [];
      
      // Transform the data to match our interface
      return stocks.map((stock: any) => ({
        ticker_id: stock.ticker_id || '',
        company_name: stock.company_name || '',
        price: parseFloat(stock.price || 0),
        percent_change: parseFloat(stock.percent_change || 0),
        net_change: parseFloat(stock.net_change || 0),
        volume: stock.volume || '',
        high: parseFloat(stock.high || 0),
        low: parseFloat(stock.low || 0),
        open: parseFloat(stock.open || 0),
        close: parseFloat(stock.close || 0),
        category: stock.category || 'gainer',
        // Keep backward compatibility
        symbol: stock.ric || stock.ticker_id || '',
        name: stock.company_name || '',
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