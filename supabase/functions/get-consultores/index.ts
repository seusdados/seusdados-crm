Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-request-id, x-user-agent, x-forwarded-for',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }

    try {
      // Get environment variables
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');

      if (!serviceRoleKey || !supabaseUrl) {
        return new Response(JSON.stringify({
          error: { code: 'CONFIG_ERROR', message: 'Configuração do Supabase ausente' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // Query parameters
      const url = new URL(req.url);
      const role = url.searchParams.get('role') || 'consultor';

      // Buscar usuários com service role para evitar problemas de RLS
      const response = await fetch(`${supabaseUrl}/rest/v1/users?role=eq.${role}&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Database query error:', errorText);
        
        return new Response(JSON.stringify({
          error: {
            code: 'DATABASE_QUERY_FAILED',
            message: 'Falha ao buscar consultores',
            details: { status: response.status }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const consultores = await response.json();

      return new Response(JSON.stringify({
        success: true,
        data: consultores,
        count: consultores.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Function error:', error);
      return new Response(JSON.stringify({
        error: { code: 'FUNCTION_ERROR', message: `Erro interno: ${error.message}` }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  });
