-- Create UPI details table similar to bank_details
CREATE TABLE public.upi_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upi_id TEXT NOT NULL,
  upi_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.upi_details ENABLE ROW LEVEL SECURITY;

-- Create policies for UPI details (similar to bank_details)
CREATE POLICY "Anyone can view active UPI details" 
ON public.upi_details 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage UPI details" 
ON public.upi_details 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_upi_details_updated_at
BEFORE UPDATE ON public.upi_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();