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
      const { email, password, full_name, role = 'consultor', phone = null, department = null } = requestBody;

      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({
          error: { code: 'MISSING_PARAMS', message: 'Email, password e full_name são obrigatórios' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({
          error: { code: 'INVALID_EMAIL', message: 'Email inválido' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Validar senha
      if (password.length < 6) {
        return new Response(JSON.stringify({
          error: { code: 'WEAK_PASSWORD', message: 'A senha deve ter pelo menos 6 caracteres' }
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

      // Criar o usuário via Admin API com todos os dados em user_metadata
      const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { 
            full_name: full_name,
            role: role,
            phone: phone,
            department: department,
            is_active: true
          }
        })
      });

      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.error('Admin API error:', errorText);
        
        let errorMessage = 'Falha ao criar usuário de autenticação';
        if (errorText.includes('already registered') || errorText.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado no sistema';
        } else if (errorText.includes('Invalid email')) {
          errorMessage = 'Email inválido';
        } else if (errorText.includes('signup_disabled')) {
          errorMessage = 'Cadastro de novos usuários está desabilitado';
        }
        
        return new Response(JSON.stringify({
          error: {
            code: 'USER_CREATION_FAILED',
            message: errorMessage,
            details: { status: adminResponse.status, error: errorText }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const userData = await adminResponse.json();
      
      // Tentar inserir na tabela users (mas não falhar se der problema)
      try {
        const insertUserData = {
          id: userData.id,
          email: email,
          full_name: full_name,
          role: role,
          phone: phone,
          department: department,
          is_active: true
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(insertUserData)
        });

        if (!insertResponse.ok) {
          console.warn('Failed to insert in users table, but auth user created successfully');
        }
      } catch (insertError) {
        console.warn('Insert in users table failed:', insertError);
        // Não falhar, pois o usuário de auth foi criado com sucesso
      }

      // Enviar notificações por e-mail após criação bem-sucedida
      try {
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/notify-new-consultor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            consultorData: {
              id: userData.id,
              email: userData.email,
              full_name: full_name,
              role: role,
              phone: phone,
              department: department
            },
            credentials: {
              email: userData.email,
              password: password
            },
            notifyConsultor: true,
            notifyTeam: true
          })
        });

        let emailStatus = 'pending';
        if (notificationResponse.ok) {
          const emailResult = await notificationResponse.json();
          emailStatus = emailResult.data?.success ? 'sent' : 'failed';
        } else {
          emailStatus = 'failed';
        }

        return new Response(JSON.stringify({
          success: true,
          message: `${role === 'consultor' ? 'Consultor' : 'Usuário'} criado com sucesso`,
          user: {
            id: userData.id,
            email: userData.email,
            full_name: full_name,
            role: role,
            phone: phone,
            department: department,
            created_at: userData.created_at
          },
          email_notifications: {
            status: emailStatus,
            message: emailStatus === 'sent' ? 'E-mails de notificação enviados' : 'Falha no envio dos e-mails de notificação'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (emailError) {
        console.warn('Falha no envio de notificações por e-mail:', emailError);
        
        // Retorna sucesso mesmo se o e-mail falhar, pois o usuário foi criado
        return new Response(JSON.stringify({
          success: true,
          message: `${role === 'consultor' ? 'Consultor' : 'Usuário'} criado com sucesso`,
          user: {
            id: userData.id,
            email: userData.email,
            full_name: full_name,
            role: role,
            phone: phone,
            department: department,
            created_at: userData.created_at
          },
          email_notifications: {
            status: 'failed',
            message: 'Usuário criado, mas falha no envio dos e-mails de notificação',
            error: emailError.message
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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
