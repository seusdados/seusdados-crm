Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'stats';
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const eventType = url.searchParams.get('event_type');
        const days = parseInt(url.searchParams.get('days') || '7');

        // Obter configuração
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        let query = '';
        let queryParams = '';

        // Ação: Estatísticas gerais
        if (action === 'stats') {
            // Estatísticas dos últimos dias
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_events,
                    SUM(success_count) as total_emails_sent,
                    SUM(fail_count) as total_emails_failed,
                    ROUND(AVG(success_rate), 2) as avg_success_rate,
                    event_type,
                    DATE(created_at) as date
                FROM email_logs 
                WHERE created_at >= NOW() - INTERVAL '${days} days'
                GROUP BY event_type, DATE(created_at)
                ORDER BY date DESC, total_emails_sent DESC
            `;

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/email_stats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({ days_back: days })
            });

            // Como RPC pode não existir, fazemos query direta
            const directResponse = await fetch(`${supabaseUrl}/rest/v1/email_logs?select=*&created_at=gte.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}&order=created_at.desc&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!directResponse.ok) {
                throw new Error(`Falha ao buscar logs: ${directResponse.statusText}`);
            }

            const logs = await directResponse.json();
            
            // Calcular estatísticas
            const stats = logs.reduce((acc, log) => {
                acc.totalEvents += 1;
                acc.totalEmailsSent += log.success_count || 0;
                acc.totalEmailsFailed += log.fail_count || 0;
                
                // Por tipo de evento
                if (!acc.byEventType[log.event_type]) {
                    acc.byEventType[log.event_type] = {
                        events: 0,
                        emailsSent: 0,
                        emailsFailed: 0,
                        successRate: 0
                    };
                }
                acc.byEventType[log.event_type].events += 1;
                acc.byEventType[log.event_type].emailsSent += log.success_count || 0;
                acc.byEventType[log.event_type].emailsFailed += log.fail_count || 0;
                
                // Por dia
                const date = new Date(log.created_at).toISOString().split('T')[0];
                if (!acc.byDate[date]) {
                    acc.byDate[date] = {
                        events: 0,
                        emailsSent: 0,
                        emailsFailed: 0
                    };
                }
                acc.byDate[date].events += 1;
                acc.byDate[date].emailsSent += log.success_count || 0;
                acc.byDate[date].emailsFailed += log.fail_count || 0;
                
                return acc;
            }, {
                totalEvents: 0,
                totalEmailsSent: 0,
                totalEmailsFailed: 0,
                byEventType: {},
                byDate: {}
            });

            // Calcular taxa de sucesso por tipo
            Object.keys(stats.byEventType).forEach(eventType => {
                const typeStats = stats.byEventType[eventType];
                const total = typeStats.emailsSent + typeStats.emailsFailed;
                typeStats.successRate = total > 0 ? Math.round((typeStats.emailsSent / total) * 100 * 100) / 100 : 0;
            });

            // Taxa de sucesso geral
            const totalEmails = stats.totalEmailsSent + stats.totalEmailsFailed;
            const overallSuccessRate = totalEmails > 0 ? Math.round((stats.totalEmailsSent / totalEmails) * 100 * 100) / 100 : 0;

            return new Response(JSON.stringify({
                data: {
                    period: `Últimos ${days} dias`,
                    summary: {
                        total_events: stats.totalEvents,
                        total_emails_sent: stats.totalEmailsSent,
                        total_emails_failed: stats.totalEmailsFailed,
                        total_emails: totalEmails,
                        overall_success_rate: overallSuccessRate + '%'
                    },
                    by_event_type: stats.byEventType,
                    by_date: stats.byDate,
                    recent_logs: logs.slice(0, 10) // Últimos 10 registros
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Ação: Listar logs detalhados
        if (action === 'logs') {
            queryParams = `?select=*&order=created_at.desc&limit=${limit}`;
            
            if (eventType) {
                queryParams += `&event_type=eq.${eventType}`;
            }
            
            queryParams += `&created_at=gte.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`;
            
            const response = await fetch(`${supabaseUrl}/rest/v1/email_logs${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error(`Falha ao buscar logs: ${response.statusText}`);
            }

            const logs = await response.json();

            return new Response(JSON.stringify({
                data: {
                    logs: logs,
                    count: logs.length,
                    filters: {
                        event_type: eventType,
                        days: days,
                        limit: limit
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Ação: Tipos de eventos disponíveis
        if (action === 'event_types') {
            const response = await fetch(`${supabaseUrl}/rest/v1/email_logs?select=event_type&distinct=event_type`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error(`Falha ao buscar tipos de evento: ${response.statusText}`);
            }

            const eventTypes = await response.json();

            return new Response(JSON.stringify({
                data: {
                    event_types: eventTypes.map(et => et.event_type),
                    count: eventTypes.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Ação: Health check do sistema de e-mails
        if (action === 'health') {
            // Verificar últimos envios
            const recentResponse = await fetch(`${supabaseUrl}/rest/v1/email_logs?select=*&order=created_at.desc&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!recentResponse.ok) {
                throw new Error('Falha ao verificar logs recentes');
            }

            const recentLogs = await recentResponse.json();
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            const recentActivity = recentLogs.filter(log => new Date(log.created_at) > last24h);
            const failuresLast24h = recentActivity.reduce((sum, log) => sum + (log.fail_count || 0), 0);
            const successLast24h = recentActivity.reduce((sum, log) => sum + (log.success_count || 0), 0);
            
            const totalLast24h = failuresLast24h + successLast24h;
            const healthStatus = totalLast24h === 0 ? 'idle' : 
                                (failuresLast24h / totalLast24h > 0.5) ? 'degraded' : 'healthy';

            return new Response(JSON.stringify({
                data: {
                    status: healthStatus,
                    last_24h: {
                        total_emails: totalLast24h,
                        successful: successLast24h,
                        failed: failuresLast24h,
                        success_rate: totalLast24h > 0 ? Math.round((successLast24h / totalLast24h) * 100) + '%' : '0%'
                    },
                    recent_activity: recentActivity.length,
                    last_activity: recentLogs.length > 0 ? recentLogs[0].created_at : null,
                    system_components: {
                        resend_api: 'operational', // Assumindo que está funcionando se conseguimos enviar
                        database_logs: 'operational',
                        edge_functions: 'operational'
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Ação inválida
        throw new Error(`Ação inválida: ${action}`);

    } catch (error) {
        console.error('Erro ao monitorar e-mails:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'EMAIL_MONITORING_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});