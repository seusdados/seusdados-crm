import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import D4SignConfigPanel from '@/components/D4SignConfigPanel'
import { supabase, Contract, Client, Proposal } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useExport } from '@/hooks/useExport'
import {
  ScrollText,
  Calendar,
  DollarSign,
  Download,
  AlertTriangle,
  Search,
  Eye,
  Edit,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Play,
  Settings
} from 'lucide-react'

interface ContratosPageProps {
  isCliente?: boolean
}

export function ContratosPage({ isCliente = false }: ContratosPageProps) {
  const { user } = useAuth()
  const { exportTable, exporting } = useExport()
  const [contracts, setContracts] = useState<(Contract & { client?: Client })[]>([])
  const [acceptedProposals, setAcceptedProposals] = useState<(Proposal & { client?: Client })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProposals, setLoadingProposals] = useState(true)
  const [processingContract, setProcessingContract] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [activeTab, setActiveTab] = useState('contratos')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expiring: 0,
    monthlyRevenue: 0
  })

  useEffect(() => {
    loadContracts()
    loadAcceptedProposals()
  }, [user, statusFilter])

  const loadContracts = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('contracts')
        .select(`
          *,
          clients!contracts_client_id_fkey(
            id, company_name, legal_representative_name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters based on user role
      if (user.role === 'cliente' || isCliente) {
        query = query.eq('client_id', user.id)
      }

      // Apply status filter
      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query

      if (error) throw error
      
      // Transform data to include client info
      const contractsWithClients = data?.map(contract => ({
        ...contract,
        client: contract.clients
      })) || []
      
      setContracts(contractsWithClients)
      
      // Calculate stats
      const total = contractsWithClients.length
      const active = contractsWithClients.filter(c => c.status === 'active').length
      const pending = contractsWithClients.filter(c => c.status === 'pending').length
      
      // Check for expiring contracts (within 30 days)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
      const expiring = contractsWithClients.filter(c => {
        if (!c.end_date) return false
        const endDate = new Date(c.end_date)
        return endDate <= thirtyDaysFromNow && endDate > now
      }).length
      
      const monthlyRevenue = contractsWithClients
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.monthly_value || 0), 0)
      
      setStats({ total, active, pending, expiring, monthlyRevenue })
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAcceptedProposals = async () => {
    if (!user) return

    try {
      setLoadingProposals(true)
      
      let query = supabase
        .from('proposals')
        .select(`
          *,
          clients!proposals_client_id_fkey(
            id, company_name, legal_representative_name, cnpj
          )
        `)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      // Apply filters based on user role
      if (user.role === 'consultor') {
        query = query.eq('consultant_id', user.id)
      }
      
      const { data, error } = await query

      if (error) throw error
      
      // Transform data to include client info and filter out proposals that already have contracts
      const proposalsWithClients = data?.map(proposal => ({
        ...proposal,
        client: proposal.clients
      })) || []
      
      // Check which proposals already have contracts
      const proposalIds = proposalsWithClients.map(p => p.id)
      const { data: existingContracts } = await supabase
        .from('contracts')
        .select('proposal_id')
        .in('proposal_id', proposalIds)
      
      const contractedProposalIds = new Set(existingContracts?.map(c => c.proposal_id) || [])
      
      // Filter out proposals that already have contracts
      const availableProposals = proposalsWithClients.filter(
        proposal => !contractedProposalIds.has(proposal.id)
      )
      
      setAcceptedProposals(availableProposals)
    } catch (error) {
      console.error('Erro ao carregar propostas aceitas:', error)
    } finally {
      setLoadingProposals(false)
    }
  }

  const handleGenerateContract = async (proposalId: string, proposalNumber: string) => {
    if (!confirm(`Confirma a geração de contrato para a proposta ${proposalNumber}?`)) {
      return
    }

    try {
      setProcessingContract(proposalId)
      
      console.log('Gerando contrato para proposta:', proposalNumber)
      
      // Call edge function to process proposal acceptance and create contract
      const { data, error } = await supabase.functions.invoke('process-proposal-acceptance', {
        body: {
          proposalId: proposalId
        }
      })

      if (error) {
        throw new Error(error.message || 'Erro ao processar proposta')
      }

      if (data?.error) {
        throw new Error(data.error.message || 'Erro ao processar proposta')
      }

      // Success
      console.log('Contrato gerado com sucesso:', data)
      alert(`Contrato gerado com sucesso!\nNúmero do contrato: ${data.data.contract.contract_number}`)
      
      // Reload data
      await loadContracts()
      await loadAcceptedProposals()
      
    } catch (error: any) {
      console.error('Erro ao gerar contrato:', error)
      alert(`Erro ao gerar contrato: ${error.message}`)
    } finally {
      setProcessingContract(null)
    }
  }

  const filteredContracts = contracts.filter(contract =>
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent_for_signature':
        return 'bg-blue-100 text-blue-800'
      case 'signed':
        return 'bg-purple-100 text-purple-800'
      case 'terminated':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'pending':
        return 'Pendente'
      case 'sent_for_signature':
        return 'Enviado para Assinatura'
      case 'signed':
        return 'Assinado'
      case 'terminated':
        return 'Encerrado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'cancelled':
      case 'terminated':
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleExportContracts = async () => {
    const dataToExport = filteredContracts.map(contract => ({
      ...contract,
      client_name: contract.client?.company_name || '',
      status_label: getStatusLabel(contract.status),
      created_at: contract.created_at ? new Date(contract.created_at).toLocaleDateString('pt-BR') : '',
      start_date: contract.start_date ? new Date(contract.start_date).toLocaleDateString('pt-BR') : '',
      end_date: contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-BR') : ''
    }))
    
    await exportTable('contracts', dataToExport, `contratos_${new Date().toISOString().split('T')[0]}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando contratos...</p>
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
              {isCliente ? 'Meus Contratos' : 'Contratos'}
            </h1>
            <p className="text-[#5a647e] mt-1">
              {isCliente 
                ? 'Visualize e gerencie seus contratos' 
                : 'Gerencie todos os contratos do sistema'
              }
            </p>
          </div>
          
          {!isCliente && (
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('contratos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'contratos'
                      ? 'bg-white text-[#1a237e] shadow-sm'
                      : 'text-[#5a647e] hover:text-[#1a237e]'
                  }`}
                >
                  Contratos
                </button>
                <button
                  onClick={() => setActiveTab('propostas')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'propostas'
                      ? 'bg-white text-[#1a237e] shadow-sm'
                      : 'text-[#5a647e] hover:text-[#1a237e]'
                  }`}
                >
                  Propostas Aceitas
                </button>
                <button
                  onClick={() => setActiveTab('d4sign')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'd4sign'
                      ? 'bg-white text-[#1a237e] shadow-sm'
                      : 'text-[#5a647e] hover:text-[#1a237e]'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-1 inline" />
                  D4Sign
                </button>
              </div>
              <Button 
                variant="outline"
                onClick={handleExportContracts}
                loading={exporting}
              >
                <Download size={18} className="mr-2" />
                {exporting ? 'Exportando...' : 'Exportar Relatório'}
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por número do contrato ou cliente..."
                  icon={<Search size={18} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-3">
                <select
                  className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="sent_for_signature">Enviado para Assinatura</option>
                  <option value="signed">Assinado</option>
                  <option value="active">Ativo</option>
                  <option value="terminated">Encerrado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter size={16} className="mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Total</p>
                  <p className="text-2xl font-bold text-[#1a237e]">{stats.total}</p>
                </div>
                <ScrollText className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Vencendo</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
                    {formatCurrency(stats.monthlyRevenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Table */}
        {activeTab === 'contratos' && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contratos</CardTitle>
            <CardDescription>
              {filteredContracts.length} {filteredContracts.length === 1 ? 'contrato encontrado' : 'contratos encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e4e8]">
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Período</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.length > 0 ? filteredContracts.map((contract) => {
                    const isExpiring = contract.end_date && new Date(contract.end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    
                    return (
                      <tr key={contract.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#333333]">#{contract.contract_number}</p>
                            <p className="text-sm text-[#5a647e]">
                              {contract.contract_type || 'Contrato de Serviços'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#333333]">
                              {contract.client?.company_name || 'Cliente não encontrado'}
                            </p>
                            {contract.client?.legal_representative_name && (
                              <p className="text-sm text-[#5a647e]">
                                {contract.client.legal_representative_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            {contract.monthly_value && (
                              <p className="font-medium text-[#333333]">
                                {formatCurrency(contract.monthly_value)}/mês
                              </p>
                            )}
                            {contract.annual_value && (
                              <p className="text-sm text-[#5a647e]">
                                {formatCurrency(contract.annual_value)}/ano
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getStatusColor(contract.status)}`}>
                              {getStatusIcon(contract.status)}
                              <span>{getStatusLabel(contract.status)}</span>
                            </span>
                            {isExpiring && contract.status === 'active' && (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" title="Contrato vencendo em breve" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {contract.start_date && (
                              <p className="text-[#333333]">
                                Início: {formatDate(contract.start_date)}
                              </p>
                            )}
                            {contract.end_date && (
                              <p className={`text-sm ${isExpiring ? 'text-yellow-600' : 'text-[#5a647e]'}`}>
                                Fim: {formatDate(contract.end_date)}
                              </p>
                            )}
                            {!contract.end_date && contract.start_date && (
                              <p className="text-sm text-[#5a647e]">Indeterminado</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" title="Visualizar">
                              <Eye size={16} />
                            </Button>
                            {!isCliente && (
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit size={16} />
                              </Button>
                            )}
                            {contract.contract_file_url && (
                              <Button variant="ghost" size="sm" title="Download">
                                <Download size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5a647e]">
                        {searchTerm || statusFilter !== 'todos'
                          ? 'Nenhum contrato encontrado com os filtros aplicados'
                          : 'Nenhum contrato encontrado'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Accepted Proposals Table */}
        {activeTab === 'propostas' && (
        <Card>
          <CardHeader>
            <CardTitle>Propostas Aceitas</CardTitle>
            <CardDescription>
              {acceptedProposals.length} {acceptedProposals.length === 1 ? 'proposta aceita disponível' : 'propostas aceitas disponíveis'} para gerar contrato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProposals ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-2" />
                  <p className="text-[#5a647e] text-sm">Carregando propostas...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e0e4e8]">
                      <th className="text-left py-3 px-4 font-medium text-[#333333]">Proposta</th>
                      <th className="text-left py-3 px-4 font-medium text-[#333333]">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-[#333333]">Valor Total</th>
                      <th className="text-left py-3 px-4 font-medium text-[#333333]">Data Aceite</th>
                      <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedProposals.length > 0 ? acceptedProposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#333333]">#{proposal.proposal_number}</p>
                            <p className="text-sm text-[#5a647e]">
                              Criada em: {formatDate(proposal.created_at)}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#333333]">
                              {proposal.client?.company_name || 'Cliente não encontrado'}
                            </p>
                            {proposal.client?.cnpj && (
                              <p className="text-sm text-[#5a647e]">
                                CNPJ: {proposal.client.cnpj}
                              </p>
                            )}
                            {proposal.client?.legal_representative_name && (
                              <p className="text-sm text-[#5a647e]">
                                {proposal.client.legal_representative_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-[#333333]">
                              {formatCurrency(proposal.total_amount)}
                            </p>
                            {proposal.discount_percentage > 0 && (
                              <p className="text-sm text-green-600">
                                {proposal.discount_percentage}% desconto
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {proposal.accepted_at ? (
                              <p className="text-[#333333]">
                                {formatDate(proposal.accepted_at)}
                              </p>
                            ) : (
                              <p className="text-[#5a647e]">Data não informada</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleGenerateContract(proposal.id, proposal.proposal_number)}
                              className="bg-[#6a1b9a] hover:bg-[#5a1580] text-white"
                              loading={processingContract === proposal.id}
                              disabled={processingContract !== null}
                            >
                              {processingContract === proposal.id ? (
                                <Play size={16} className="mr-1" />
                              ) : (
                                <FileText size={16} className="mr-1" />
                              )}
                              {processingContract === proposal.id ? 'Processando...' : 'Gerar Contrato'}
                            </Button>
                            <Button variant="ghost" size="sm" title="Visualizar Proposta">
                              <Eye size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#5a647e]">
                          {!loadingProposals && (
                            <div className="flex flex-col items-center space-y-3">
                              <FileText className="w-12 h-12 text-[#e0e4e8]" />
                              <div>
                                <p className="font-medium">Nenhuma proposta aceita encontrada</p>
                                <p className="text-sm">As propostas aceitas aparecerão aqui para geração de contratos</p>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* D4Sign Configuration Tab */}
        {activeTab === 'd4sign' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuração D4Sign
                </CardTitle>
                <CardDescription>
                  Configure a integração com a D4Sign para assinatura eletrônica de contratos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6">
                  <D4SignConfigPanel 
                    onConfigSaved={() => {
                      // Callback quando configuração for salva
                      console.log('Configuração D4Sign salva com sucesso');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status da Integração */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Integração</CardTitle>
                <CardDescription>
                  Informações sobre o status atual da integração D4Sign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Configuração</span>
                    </div>
                    <p className="text-sm text-green-700">Sistema configurado e ativo</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Ambiente</span>
                    </div>
                    <p className="text-sm text-blue-700">Produção (Validade Jurídica)</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Documentos</span>
                    </div>
                    <p className="text-sm text-purple-700">Prontos para assinatura</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}