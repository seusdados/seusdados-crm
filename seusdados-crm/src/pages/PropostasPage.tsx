import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreateProposalModal } from '@/components/CreateProposalModal'
import { supabase, Proposal, Client } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Link,
  Calendar,
  DollarSign,
  Filter,
  Download
} from 'lucide-react'

interface PropostasPageProps {
  isCliente?: boolean
}

export function PropostasPage({ isCliente = false }: PropostasPageProps) {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<(Proposal & { client?: Client })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadProposals()
  }, [user, statusFilter])

  const loadProposals = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('proposals')
        .select(`
          *,
          clients!proposals_client_id_fkey(
            id, company_name, legal_representative_name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters based on user role
      if (user.role === 'consultor') {
        query = query.eq('consultant_id', user.id)
      } else if (user.role === 'cliente' || isCliente) {
        query = query.eq('client_id', user.id)
      }

      // Apply status filter
      if (statusFilter !== 'todas') {
        query = query.eq('status', statusFilter)
      }
      
      const { data, error } = await query

      if (error) throw error
      
      // Transform data to include client info
      const proposalsWithClients = data?.map(proposal => ({
        ...proposal,
        client: proposal.clients
      })) || []
      
      setProposals(proposalsWithClients)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = proposals.filter(proposal =>
    proposal.proposal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'viewed':
        return 'bg-purple-100 text-purple-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceita'
      case 'sent':
        return 'Enviada'
      case 'viewed':
        return 'Visualizada'
      case 'rejected':
        return 'Rejeitada'
      case 'expired':
        return 'Expirada'
      case 'draft':
        return 'Rascunho'
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando propostas...</p>
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
              {isCliente ? 'Minhas Propostas' : 'Propostas'}
            </h1>
            <p className="text-[#5a647e] mt-1">
              {isCliente 
                ? 'Visualize e gerencie suas propostas' 
                : 'Gerencie todas as propostas comerciais'
              }
            </p>
          </div>
          
          {!isCliente && (
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download size={18} className="mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={18} className="mr-2" />
                Nova Proposta
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
                  placeholder="Buscar por número da proposta ou cliente..."
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
                  <option value="todas">Todos os Status</option>
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviadas</option>
                  <option value="viewed">Visualizadas</option>
                  <option value="accepted">Aceitas</option>
                  <option value="rejected">Rejeitadas</option>
                  <option value="expired">Expiradas</option>
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Total</p>
                  <p className="text-2xl font-bold text-[#1a237e]">{proposals.length}</p>
                </div>
                <FileText className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Enviadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {proposals.filter(p => p.status === 'sent').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Aceitas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {proposals.filter(p => p.status === 'accepted').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Valor Total</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    {formatCurrency(proposals.reduce((sum, p) => sum + p.total_amount, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Propostas</CardTitle>
            <CardDescription>
              {filteredProposals.length} {filteredProposals.length === 1 ? 'proposta encontrada' : 'propostas encontradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e4e8]">
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Proposta</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.length > 0 ? filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-[#333333]">#{proposal.proposal_number}</p>
                          <p className="text-sm text-[#5a647e]">
                            {proposal.contract_duration_type === 'fixed_term' ? 'Prazo fixo' : 'Indeterminado'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-[#333333]">
                            {proposal.client?.company_name || 'Cliente não encontrado'}
                          </p>
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
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(proposal.status)}`}>
                          {getStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-[#333333]">
                            {formatDate(proposal.created_at)}
                          </p>
                          {proposal.expires_at && (
                            <p className="text-xs text-[#5a647e] flex items-center">
                              <Calendar size={12} className="mr-1" />
                              Expira: {formatDate(proposal.expires_at)}
                            </p>
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
                          {proposal.unique_link && (
                            <Button variant="ghost" size="sm" title="Copiar link">
                              <Link size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5a647e]">
                        Nenhuma proposta encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadProposals}
      />
    </DashboardLayout>
  )
}