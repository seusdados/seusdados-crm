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

      // Buscar usuários via Auth Admin API
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth Admin API error:', errorText);
        
        return new Response(JSON.stringify({
          error: {
            code: 'AUTH_QUERY_FAILED',
            message: 'Falha ao buscar consultores via auth',
            details: { status: response.status }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const authData = await response.json();
      const users = authData.users || [];
      
      // Filtrar consultores e mapear para o formato esperado
      const consultores = users
        .filter(user => user.user_metadata?.role === role)
        .map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          role: user.user_metadata?.role || role,
          phone: user.user_metadata?.phone || null,
          department: user.user_metadata?.department || null,
          is_active: user.user_metadata?.is_active !== false,
          created_at: user.created_at,
          updated_at: user.updated_at
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
