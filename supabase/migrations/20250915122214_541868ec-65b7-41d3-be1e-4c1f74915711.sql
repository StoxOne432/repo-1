-- Create user_watchlist table for user-specific stock watchlists
CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL,
  stock_name TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_symbol)
);

-- Enable RLS for user_watchlist
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user_watchlist
CREATE POLICY "Users can view their own watchlist" 
ON public.user_watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" 
ON public.user_watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" 
ON public.user_watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add purchase_date and purchase_price to user_portfolios
ALTER TABLE public.user_portfolios 
ADD COLUMN purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN purchase_price NUMERIC DEFAULT 0;

-- Update existing records to have purchase_price equal to avg_price and purchase_date as created_at
UPDATE public.user_portfolios 
SET purchase_price = avg_price, purchase_date = created_at 
WHERE purchase_price = 0;

-- Create portfolio_price_updates table for tracking daily price updates
CREATE TABLE public.portfolio_price_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_symbol TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stock_symbol, price_date)
);

-- Enable RLS for portfolio_price_updates (publicly readable for current prices)
ALTER TABLE public.portfolio_price_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price updates" 
ON public.portfolio_price_updates 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_watchlist_user_id ON public.user_watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON public.user_watchlist(stock_symbol);
CREATE INDEX idx_price_updates_symbol_date ON public.portfolio_price_updates(stock_symbol, price_date);
CREATE INDEX idx_portfolio_user_symbol ON public.user_portfolios(user_id, stock_symbol);