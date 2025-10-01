import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreateProposalModal } from '@/components/CreateProposalModal'
import { supabase } from '@/lib/supabase'
import {
  Users,
  FileText,
  ScrollText,
  TrendingUp,
  DollarSign,
  Clock,
  Building2,
  Plus,
  Eye,
  UserPlus
} from 'lucide-react'

interface DashboardStats {
  totalClients: number
  totalProposals: number
  totalContracts: number
  monthlyRevenue: number
  pendingProposals: number
  activeContracts: number
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({} as DashboardStats)
  const [loading, setLoading] = useState(true)
  const [recentProposals, setRecentProposals] = useState<any[]>([])
  const [showCreateProposalModal, setShowCreateProposalModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Load stats based on role
      if (user.role === 'admin') {
        await loadAdminStats()
      } else if (user.role === 'consultor') {
        await loadConsultorStats()
      } else if (user.role === 'cliente') {
        await loadClienteStats()
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminStats = async () => {
    const [clientsResult, proposalsResult, contractsResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('proposals').select('*'),
      supabase.from('contracts').select('*')
    ])

    const proposals = proposalsResult.data || []
    const contracts = contractsResult.data || []
    
    setStats({
      totalClients: clientsResult.count || 0,
      totalProposals: proposals.length,
      totalContracts: contracts.length,
      monthlyRevenue: contracts
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.monthly_value || 0), 0),
      pendingProposals: proposals.filter(p => p.status === 'sent').length,
      activeContracts: contracts.filter(c => c.status === 'active').length
    })

    // Load recent proposals
    const { data: recent } = await supabase
      .from('proposals')
      .select(`
        id, proposal_number, status, total_amount, created_at,
        clients!proposals_client_id_fkey(company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentProposals(recent || [])
  }

  const loadConsultorStats = async () => {
    const [clientsResult, proposalsResult, contractsResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('proposals').select('*').eq('consultant_id', user.id),
      supabase.from('contracts').select('*')
    ])

    const proposals = proposalsResult.data || []
    const allContracts = contractsResult.data || []
    const myContracts = allContracts.filter(c => 
      proposals.some(p => p.id === c.proposal_id)
    )
    
    setStats({
      totalClients: clientsResult.count || 0,
      totalProposals: proposals.length,
      totalContracts: myContracts.length,
      monthlyRevenue: myContracts
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.monthly_value || 0), 0),
      pendingProposals: proposals.filter(p => p.status === 'sent').length,
      activeContracts: myContracts.filter(c => c.status === 'active').length
    })

    // Load recent proposals for this consultant
    const { data: recent } = await supabase
      .from('proposals')
      .select(`
        id, proposal_number, status, total_amount, created_at,
        clients!proposals_client_id_fkey(company_name)
      `)
      .eq('consultant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentProposals(recent || [])
  }

  const loadClienteStats = async () => {
    const [proposalsResult, contractsResult] = await Promise.all([
      supabase.from('proposals').select('*').eq('client_id', user.id),
      supabase.from('contracts').select('*').eq('client_id', user.id)
    ])

    const proposals = proposalsResult.data || []
    const contracts = contractsResult.data || []
    
    setStats({
      totalClients: 1, // Only themselves
      totalProposals: proposals.length,
      totalContracts: contracts.length,
      monthlyRevenue: contracts
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.monthly_value || 0), 0),
      pendingProposals: proposals.filter(p => p.status === 'sent').length,
      activeContracts: contracts.filter(c => c.status === 'active').length
    })

    setRecentProposals(proposals.slice(-5).reverse())
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a237e]">
              Olá, {user?.full_name}!
            </h1>
            <p className="text-[#5a647e] mt-1">
              {user?.role === 'admin' && 'Visão geral do sistema'}
              {user?.role === 'consultor' && 'Seu pipeline de vendas'}
              {user?.role === 'cliente' && 'Sua área exclusiva'}
            </p>
          </div>
          
          {user?.role === 'consultor' && (
            <Button onClick={() => setShowCreateProposalModal(true)}>
              <Plus size={18} className="mr-2" />
              Nova Proposta
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.role !== 'cliente' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#5a647e] font-medium">Total de Clientes</p>
                    <p className="text-2xl font-bold text-[#1a237e]">{stats.totalClients}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">
                    {user?.role === 'cliente' ? 'Minhas Propostas' : 'Propostas'}
                  </p>
                  <p className="text-2xl font-bold text-[#1a237e]">{stats.totalProposals}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">
                    {user?.role === 'cliente' ? 'Meus Contratos' : 'Contratos Ativos'}
                  </p>
                  <p className="text-2xl font-bold text-[#1a237e]">{stats.activeContracts}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                  <ScrollText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Receita Mensal</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    R$ {stats.monthlyRevenue?.toLocaleString('pt-BR') || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Propostas Recentes</CardTitle>
              <CardDescription>
                {user?.role === 'cliente' ? 'Suas propostas mais recentes' : 'Últimas propostas criadas'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProposals.length > 0 ? recentProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-3 bg-[#f7f8fc] rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[#333333]">
                        #{proposal.proposal_number}
                      </p>
                      <p className="text-sm text-[#5a647e]">
                        {proposal.clients?.company_name || 'Cliente não encontrado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#1a237e]">
                        R$ {proposal.total_amount?.toLocaleString('pt-BR')}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status === 'accepted' ? 'Aceita' :
                         proposal.status === 'sent' ? 'Enviada' :
                         proposal.status === 'rejected' ? 'Rejeitada' :
                         proposal.status === 'draft' ? 'Rascunho' : proposal.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-[#5a647e] py-6">
                    Nenhuma proposta encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user?.role === 'admin' && (
                  <>
                    <Button variant="outline" className="w-full justify-start">
                      <UserPlus size={18} className="mr-3" />
                      Cadastrar Consultor
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 size={18} className="mr-3" />
                      Novo Cliente
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Eye size={18} className="mr-3" />
                      Ver Relatórios
                    </Button>
                  </>
                )}
                
                {user?.role === 'consultor' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setShowCreateProposalModal(true)}
                    >
                      <Plus size={18} className="mr-3" />
                      Nova Proposta
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 size={18} className="mr-3" />
                      Meus Clientes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ScrollText size={18} className="mr-3" />
                      Ver Contratos
                    </Button>
                  </>
                )}
                
                {user?.role === 'cliente' && (
                  <>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText size={18} className="mr-3" />
                      Minhas Propostas
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ScrollText size={18} className="mr-3" />
                      Meus Contratos
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Proposal Modal */}
      {user?.role === 'consultor' && (
        <CreateProposalModal
          isOpen={showCreateProposalModal}
          onClose={() => setShowCreateProposalModal(false)}
          onSuccess={loadDashboardData}
        />
      )}
    </DashboardLayout>
  )
}