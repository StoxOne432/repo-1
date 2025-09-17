import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create anon client for user verification
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user is authenticated using anon client with the user's token
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token)
    if (userError || !user) {
      console.error('User verification error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role using service client
    const { data: roles, error: roleError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roles?.role !== 'admin') {
      console.error('Role check error:', roleError, 'Role:', roles?.role)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user ID to delete from request body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin user ${user.id} attempting to delete user ${userId}`)

    // First, delete all related data to avoid foreign key constraint violations
    try {
      // Delete user's orders
      await serviceClient.from('orders').delete().eq('user_id', userId)
      
      // Delete user's portfolio entries
      await serviceClient.from('user_portfolios').delete().eq('user_id', userId)
      
      // Delete user's watchlist
      await serviceClient.from('user_watchlist').delete().eq('user_id', userId)
      
      // Delete user's fund requests
      await serviceClient.from('fund_requests').delete().eq('user_id', userId)
      
      // Delete user's withdrawal requests
      await serviceClient.from('withdrawal_requests').delete().eq('user_id', userId)
      
      // Delete user's KYC documents
      await serviceClient.from('kyc_documents').delete().eq('user_id', userId)
      
      // Delete user's roles
      await serviceClient.from('user_roles').delete().eq('user_id', userId)
      
      // Delete user's profile
      await serviceClient.from('profiles').delete().eq('user_id', userId)
      
      console.log(`Deleted all related data for user ${userId}`)
    } catch (relatedDataError) {
      console.error('Error deleting related data:', relatedDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user related data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Now delete the user using service client admin API
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully deleted user ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})