-- Create bank_details table for admin configuration
CREATE TABLE public.bank_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  bank_name text NOT NULL,
  branch text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active bank details" 
ON public.bank_details 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage bank details" 
ON public.bank_details 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bank_details_updated_at
BEFORE UPDATE ON public.bank_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bank details
INSERT INTO public.bank_details (account_name, account_number, ifsc_code, bank_name, branch)
VALUES ('TradePro Finance Ltd', '123456789012', 'HDFC0001234', 'HDFC Bank', 'Mumbai Main Branch');