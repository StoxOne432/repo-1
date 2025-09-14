-- Add missing RLS policies for user_portfolios table to allow users to manage their own portfolio
CREATE POLICY "Users can insert their own portfolio entries" 
ON public.user_portfolios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio entries" 
ON public.user_portfolios 
FOR UPDATE 
USING (auth.uid() = user_id);