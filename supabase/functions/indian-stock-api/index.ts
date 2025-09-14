import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const apiKey = Deno.env.get('INDIAN_STOCK_API_KEY');

    if (!apiKey) {
      throw new Error('Indian Stock API key not configured');
    }

    let apiUrl = '';
    
    if (path.includes('/trending')) {
      apiUrl = 'https://stock.indianapi.in/trending';
    } else if (path.includes('/search')) {
      const query = url.searchParams.get('query');
      
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Query parameter is required' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      apiUrl = `https://stock.indianapi.in/industry_search?query=${encodeURIComponent(query)}`;
    } else if (path.includes('/stock')) {
      const name = url.searchParams.get('name');
      
      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Name parameter is required' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      apiUrl = `https://stock.indianapi.in/stock?name=${encodeURIComponent(name)}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Calling Indian Stock API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API Response:`, data);

    // Handle trending stocks response - combine gainers and losers
    if (path.includes('/trending') && data.trending_stocks && Array.isArray(data.trending_stocks)) {
      const combinedStocks = [];
      
      for (const stockGroup of data.trending_stocks) {
        if (stockGroup.top_gainers && Array.isArray(stockGroup.top_gainers)) {
          combinedStocks.push(...stockGroup.top_gainers.map((stock: any) => ({
            ...stock,
            category: 'gainer'
          })));
        }
        if (stockGroup.top_losers && Array.isArray(stockGroup.top_losers)) {
          combinedStocks.push(...stockGroup.top_losers.map((stock: any) => ({
            ...stock,
            category: 'loser'
          })));
        }
      }
      
      console.log(`Combined stocks:`, combinedStocks);
      
      return new Response(JSON.stringify(combinedStocks), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in indian-stock-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to fetch stock data'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});