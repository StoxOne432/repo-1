import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const indianStockApiKey = Deno.env.get('INDIAN_STOCK_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting portfolio price update job...');

    // Get all unique stock symbols from user portfolios
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('user_portfolios')
      .select('stock_symbol')
      .gte('quantity', 1); // Only active positions

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError);
      throw portfoliosError;
    }

    // Get unique symbols
    const uniqueSymbols = [...new Set(portfolios?.map(p => p.stock_symbol) || [])];
    console.log(`Found ${uniqueSymbols.length} unique symbols to update`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update prices for each symbol
    for (const symbol of uniqueSymbols) {
      try {
        // Fetch current price from Indian Stock API
        const stockResponse = await fetch(
          `https://api.indianapi.in/stock?symbol=${symbol}`,
          {
            headers: {
              'X-API-KEY': indianStockApiKey
            }
          }
        );

        if (!stockResponse.ok) {
          console.error(`Failed to fetch price for ${symbol}: ${stockResponse.status}`);
          errorCount++;
          continue;
        }

        const stockData = await stockResponse.json();
        const currentPrice = parseFloat(stockData.price || stockData.ltp || '0');

        if (currentPrice <= 0) {
          console.error(`Invalid price for ${symbol}: ${currentPrice}`);
          errorCount++;
          continue;
        }

        // Update portfolio_price_updates table
        const { error: priceUpdateError } = await supabase
          .from('portfolio_price_updates')
          .upsert({
            stock_symbol: symbol,
            current_price: currentPrice,
            price_date: new Date().toISOString().split('T')[0], // Today's date
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stock_symbol,price_date'
          });

        if (priceUpdateError) {
          console.error(`Error updating price for ${symbol}:`, priceUpdateError);
          errorCount++;
          continue;
        }

        // Update user_portfolios with new current_price and profit_loss
        const { data: portfolioData, error: portfolioFetchError } = await supabase
          .from('user_portfolios')
          .select('id, quantity, purchase_price, avg_price')
          .eq('stock_symbol', symbol)
          .gte('quantity', 1);

        if (portfolioFetchError) {
          console.error(`Error fetching portfolio data for ${symbol}:`, portfolioFetchError);
          errorCount++;
          continue;
        }

        // Update each portfolio entry
        for (const portfolio of portfolioData || []) {
          const purchasePrice = portfolio.purchase_price || portfolio.avg_price;
          const profitLoss = (currentPrice - purchasePrice) * portfolio.quantity;

          const { error: updateError } = await supabase
            .from('user_portfolios')
            .update({
              current_price: currentPrice,
              profit_loss: profitLoss,
              updated_at: new Date().toISOString()
            })
            .eq('id', portfolio.id);

          if (updateError) {
            console.error(`Error updating portfolio ${portfolio.id}:`, updateError);
            errorCount++;
          }
        }

        updatedCount++;
        console.log(`Updated prices for ${symbol}: ₹${currentPrice}`);

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Portfolio price update completed. Updated: ${updatedCount}, Errors: ${errorCount}`,
      updated_count: updatedCount,
      error_count: errorCount
    };

    console.log('Portfolio price update job completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-portfolio-prices function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});