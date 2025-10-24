import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const { companyId } = await req.json();

    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting data migration for company:', companyId);

    const tables = [
      'payroll_records',
      'vacation_requests',
      'vacation_balance',
      'time_entries',
      'schedule_changes',
      'compensatory_days',
      'notifications'
    ];

    let totalUpdated = 0;
    const results: Record<string, number> = {};

    for (const table of tables) {
      console.log(`Updating ${table}...`);
      
      const { data, error } = await supabaseAdmin
        .from(table)
        .update({ company_id: companyId })
        .is('company_id', null)
        .select();

      if (error) {
        console.error(`Error updating ${table}:`, error);
        // Continue with other tables even if one fails
        results[table] = 0;
        continue;
      }

      const count = data?.length || 0;
      results[table] = count;
      totalUpdated += count;
      
      console.log(`Updated ${count} records in ${table}`);
    }

    console.log('Migration completed. Total records updated:', totalUpdated);

    return new Response(
      JSON.stringify({
        success: true,
        totalUpdated,
        details: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Migration error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
