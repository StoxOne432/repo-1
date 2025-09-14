-- Add bank details columns to kyc_documents table
ALTER TABLE public.kyc_documents 
ADD COLUMN bank_name text,
ADD COLUMN account_number text,
ADD COLUMN ifsc_code text,
ADD COLUMN account_holder_name text;