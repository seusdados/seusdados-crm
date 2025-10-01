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
      // Get parameters from request body
      const requestBody = await req.json();
      const { consultor_id } = requestBody;

      if (!consultor_id) {
        return new Response(JSON.stringify({
          error: { code: 'MISSING_PARAMS', message: 'ID do consultor é obrigatório' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

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

      // Primeiro, verificar se o consultor tem propostas associadas
      const checkProposalsResponse = await fetch(`${supabaseUrl}/rest/v1/proposals?consultant_id=eq.${consultor_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        }
      });

      if (checkProposalsResponse.ok) {
        const proposals = await checkProposalsResponse.json();
        if (proposals && proposals.length > 0) {
          return new Response(JSON.stringify({
            error: { code: 'CONSULTOR_HAS_PROPOSALS', message: 'Não é possível excluir este consultor pois ele possui propostas associadas.' }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
      }

      // Deletar o usuário via Admin API
      const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${consultor_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        }
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error('Admin API delete error:', errorText);
        
        let errorMessage = 'Falha ao excluir consultor';
        if (errorText.includes('not found') || deleteResponse.status === 404) {
          errorMessage = 'Consultor não encontrado';
        }
        
        return new Response(JSON.stringify({
          error: {
            code: 'DELETE_FAILED',
            message: errorMessage,
            details: { status: deleteResponse.status }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Tentar também deletar da tabela users se existir registro
      try {
        await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${consultor_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
          }
        });
      } catch (cleanupError) {
        console.warn('Falha ao deletar da tabela users (não crítico):', cleanupError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Consultor excluído com sucesso'
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
