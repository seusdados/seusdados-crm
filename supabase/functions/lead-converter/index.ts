// Edge Function: lead-converter
// Descrição: Conversão automática de respostas em leads no CRM

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

Deno.serve(async (req) => {
  // Lidar com requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }
  
  // Apenas aceitar métodos POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }
  
  try {
    // Criar cliente Supabase usando variáveis de ambiente
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Autenticação: extrair e verificar o token JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Extrair dados da requisição
    const { 
      response_id,
      consultant_id = null, // ID do consultor opcional (se não fornecido, será atribuído aleatoriamente)
      lead_source = 'questionnaire' // Fonte do lead (padrão: questionário)
    } = await req.json()
    
    // Validar dados mínimos
    if (!response_id) {
      throw new Error('ID da resposta não fornecido')
    }

    // Buscar a resposta do questionário
    const { data: response, error: responseError } = await supabaseClient
      .from('questionnaire_responses')
      .select(`
        *,
        questionnaires(id, name, category)
      `)
      .eq('id', response_id)
      .single()
    
    if (responseError) throw responseError
    
    // Verificar se a resposta já foi convertida em lead
    if (response.lead_converted) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Esta resposta já foi convertida em lead',
          lead_converted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se já existe um cliente com o email fornecido
    let existingClientId = null
    
    if (response.respondent_email) {
      const { data: existingClients, error: clientsError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('legal_representative_email', response.respondent_email)
        .limit(1)
      
      if (!clientsError && existingClients && existingClients.length > 0) {
        existingClientId = existingClients[0].id
      }
    }

    // Se não foi especificado um consultor, atribuir aleatoriamente
    let assignedConsultantId = consultant_id
    
    if (!assignedConsultantId) {
      const { data: consultants, error: consultantsError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('role', 'consultor')
        .eq('is_active', true)
      
      if (consultantsError) throw consultantsError
      
      if (consultants && consultants.length > 0) {
        // Selecionar aleatoriamente um consultor
        const randomIndex = Math.floor(Math.random() * consultants.length)
        assignedConsultantId = consultants[randomIndex].id
      }
    }

    // Extrair dados da resposta para criar o lead
    let clientData: any = {
      status: 'lead',
      lead_source: `${lead_source}: ${response.questionnaires.name}`,
      notes: `Gerado a partir do questionário: ${response.questionnaires.name}\nPontuação: ${response.calculated_score}\nData de resposta: ${new Date(response.created_at).toLocaleString('pt-BR')}`,
    }
    
    // Adicionar nome e email se fornecidos
    if (response.respondent_name) {
      clientData.company_name = response.respondent_name
      clientData.legal_representative_name = response.respondent_name
    }
    
    if (response.respondent_email) {
      clientData.legal_representative_email = response.respondent_email
    }
    
    // Extrair outros dados relevantes das respostas do questionário
    // Exemplos de campos que podem ser mapeados:
    // - CNPJ
    // - Telefone
    // - Endereço
    // etc.
    if (response.responses_json) {
      const responses = response.responses_json
      
      // Mapear CNPJ se presente
      if (responses.cnpj) {
        clientData.cnpj = responses.cnpj
      }
      
      // Mapear telefone se presente
      if (responses.telefone || responses.phone) {
        clientData.legal_representative_phone = responses.telefone || responses.phone
      }
      
      // Mapear endereço se presente
      if (responses.endereco || responses.address) {
        clientData.address = responses.endereco || responses.address
      }
      
      // Adicionar todos os dados de resposta como JSON nas notas
      clientData.notes += `\n\nRespostas detalhadas:\n${JSON.stringify(responses, null, 2)}`
    }

    let clientId: string
    
    // Se o cliente já existe, atualizar suas informações
    if (existingClientId) {
      const { data: updatedClient, error: updateError } = await supabaseClient
        .from('clients')
        .update({
          notes: supabaseClient.rpc('append_text', { 
            base_text: clientData.notes,
            row_id: existingClientId,
            column_name: 'notes'
          })
        })
        .eq('id', existingClientId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      clientId = existingClientId
      
    } else {
      // Caso contrário, criar um novo cliente (lead)
      const { data: newClient, error: createError } = await supabaseClient
        .from('clients')
        .insert(clientData)
        .select()
        .single()
      
      if (createError) throw createError
      
      clientId = newClient.id
    }

    // Criar uma tarefa para o consultor atribuído
    if (assignedConsultantId) {
      const { error: taskError } = await supabaseClient
        .from('tasks')
        .insert({
          title: `Novo lead gerado via questionário: ${response.respondent_name || 'Sem nome'}`,
          description: `Contato gerado a partir do questionário ${response.questionnaires.name}.\nPontuação: ${response.calculated_score}\nEmail: ${response.respondent_email || 'Não informado'}`,
          status: 'pending',
          priority: 'high',
          due_date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 horas a partir de agora
          assigned_to: assignedConsultantId,
          client_id: clientId,
          task_type: 'lead_follow_up'
        })
      
      if (taskError) {
        console.error('Erro ao criar tarefa:', taskError)
        // Não lançamos o erro para não impedir a conversão do lead
      }
    }

    // Enviar notificação (exemplo: inserção em tabela de notificações)
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: assignedConsultantId,
        title: 'Novo Lead',
        content: `Um novo lead foi gerado a partir do questionário ${response.questionnaires.name}.`,
        type: 'lead',
        is_read: false,
        link: `/clientes/${clientId}`
      })
    
    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError)
      // Não lançamos o erro para não impedir a conversão do lead
    }

    // Marcar a resposta como convertida em lead
    const { error: updateError } = await supabaseClient
      .from('questionnaire_responses')
      .update({ lead_converted: true })
      .eq('id', response_id)
    
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Resposta convertida em lead com sucesso',
        client_id: clientId,
        consultant_id: assignedConsultantId,
        is_new_client: !existingClientId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: 'LEAD_CONVERTER_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
