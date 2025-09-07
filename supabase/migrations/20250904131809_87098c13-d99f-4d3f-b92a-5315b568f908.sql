-- Create storage bucket for fund request receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fund-receipts', 'fund-receipts', false);

-- Create fund_requests table
CREATE TABLE public.fund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  receipt_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_portfolios table for P&L management
CREATE TABLE public.user_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit_loss NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;

-- RLS policies for fund_requests
CREATE POLICY "Users can view their own fund requests" 
ON public.fund_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fund requests" 
ON public.fund_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all fund requests" 
ON public.fund_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_portfolios
CREATE POLICY "Users can view their own portfolio" 
ON public.user_portfolios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all portfolios" 
ON public.user_portfolios 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for fund receipts
CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fund-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fund-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fund-receipts' AND has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_fund_requests_updated_at
BEFORE UPDATE ON public.fund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_portfolios_updated_at
BEFORE UPDATE ON public.user_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();