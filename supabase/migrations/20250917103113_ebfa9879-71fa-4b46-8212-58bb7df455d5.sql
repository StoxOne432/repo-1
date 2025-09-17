-- Add DELETE policy for users to delete their own portfolio entries
CREATE POLICY "Users can delete their own portfolio entries" 
ON public.user_portfolios 
FOR DELETE 
USING (auth.uid() = user_id);