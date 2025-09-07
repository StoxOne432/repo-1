-- Add verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN verification_date timestamp with time zone,
ADD COLUMN verification_notes text;

-- Create index for faster queries on verification status
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);

-- Update existing users to be approved (so current users don't get locked out)
UPDATE public.profiles SET 
  is_verified = true, 
  verification_status = 'approved', 
  verification_date = now()
WHERE verification_status = 'pending';