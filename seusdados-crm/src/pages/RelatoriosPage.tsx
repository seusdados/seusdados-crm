import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useExport } from '@/hooks/useExport'
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Filter,
  RefreshCw
} from 'lucide-react'


interface ReportData {
  salesByMonth: any[]
  proposalsByStatus: any[]
  consultorPerformance: any[]
  revenueGrowth: any[]
  conversionRate: number
  totalRevenue: number
  avgDealSize: number
  activeClients: number
}


const COLORS = ['#6a1b9a', '#1a237e', '#4caf50', '#ff9800', '#f44336']

export function RelatoriosPage() {
  const { user } = useAuth()
  const { exportTable, exporting } = useExport()
  const [reportData, setReportData] = useState<ReportData>({} as ReportData)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedConsultor, setSelectedConsultor] = useState('todos')
  const [consultores, setConsultores] = useState<any[]>([])

  useEffect(() => {
    loadReportData()
    loadConsultores()
  }, [dateRange, selectedConsultor])

  const loadConsultores = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'consultor')
        .eq('is_active', true)
      
      setConsultores(data || [])
    } catch (error) {
      console.error('Erro ao carregar consultores:', error)
    }
  }

  const loadReportData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Carregar dados de propostas
      let proposalsQuery = supabase
        .from('proposals')
        .select(`
          *,
          clients!proposals_client_id_fkey(company_name),
          users!proposals_consultant_id_fkey(full_name)
        `)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59')
      
      if (selectedConsultor !== 'todos') {
        proposalsQuery = proposalsQuery.eq('consultant_id', selectedConsultor)
      }
      
      const { data: proposals } = await proposalsQuery
      
      // Carregar contratos
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate + 'T23:59:59')
      
      // Carregar clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
      
      // Processar dados para os gráficos
      const processedData = processReportData(proposals || [], contracts || [], clients || [])
      setReportData(processedData)
      
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (proposals: any[], contracts: any[], clients: any[]): ReportData => {
    // Vendas por mês
    const salesByMonth = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(0, i).toLocaleDateString('pt-BR', { month: 'short' })
      const monthNumber = i + 1
      const monthProposals = proposals.filter(p => {
        const proposalMonth = new Date(p.created_at).getMonth() + 1
        return proposalMonth === monthNumber && p.status === 'accepted'
      })
      
      return {
        month,
        vendas: monthProposals.length,
        receita: monthProposals.reduce((sum, p) => sum + (p.total_amount || 0), 0)
      }
    })

    // Propostas por status
    const statusCounts = proposals.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})
    
    const proposalsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status === 'accepted' ? 'Aceitas' :
              status === 'rejected' ? 'Rejeitadas' :
              status === 'sent' ? 'Enviadas' :
              status === 'draft' ? 'Rascunho' : status,
      count
    }))

    // Performance por consultor
    const consultorStats = consultores.reduce((acc, consultor) => {
      const consultorProposals = proposals.filter(p => p.consultant_id === consultor.id)
      const acceptedProposals = consultorProposals.filter(p => p.status === 'accepted')
      
      acc.push({
        consultor: consultor.full_name,
        propostas: consultorProposals.length,
        aprovadas: acceptedProposals.length,
        receita: acceptedProposals.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        conversao: consultorProposals.length > 0 ? 
          Math.round((acceptedProposals.length / consultorProposals.length) * 100) : 0
      })
      
      return acc
    }, [])

    // Crescimento de receita
    const revenueGrowth = salesByMonth.map((month, index) => ({
      ...month,
      crescimento: index > 0 ? 
        ((month.receita - salesByMonth[index - 1].receita) / (salesByMonth[index - 1].receita || 1)) * 100 : 0
    }))

    // Métricas gerais
    const acceptedProposals = proposals.filter(p => p.status === 'accepted')
    const conversionRate = proposals.length > 0 ? (acceptedProposals.length / proposals.length) * 100 : 0
    const totalRevenue = acceptedProposals.reduce((sum, p) => sum + (p.total_amount || 0), 0)
    const avgDealSize = acceptedProposals.length > 0 ? totalRevenue / acceptedProposals.length : 0
    const activeClients = clients.length

    return {
      salesByMonth,
      proposalsByStatus,
      consultorPerformance: consultorStats,
      revenueGrowth,
      conversionRate: Math.round(conversionRate),
      totalRevenue,
      avgDealSize,
      activeClients
    }
  }



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleExportReport = async () => {
    const reportSummary = {
      data_inicio: dateRange.startDate,
      data_fim: dateRange.endDate,
      consultor_selecionado: selectedConsultor === 'todos' ? 'Todos' : consultores.find(c => c.id === selectedConsultor)?.full_name || 'N/A',
      taxa_conversao: `${reportData.conversionRate || 0}%`,
      receita_total: formatCurrency(reportData.totalRevenue || 0),
      ticket_medio: formatCurrency(reportData.avgDealSize || 0),
      clientes_ativos: reportData.activeClients || 0,
      gerado_em: new Date().toLocaleString('pt-BR')
    }
    
    await exportTable('relatorio', [reportSummary], `relatorio_${new Date().toISOString().split('T')[0]}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando relatórios...</p>
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
            <h1 className="text-3xl font-bold text-[#1a237e]">Relatórios</h1>
            <p className="text-[#5a647e] mt-1">
              Analytics e relatórios detalhados do sistema
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleExportReport}
              loading={exporting}
            >
              <Download size={18} className="mr-2" />
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
            <Button onClick={loadReportData}>
              <RefreshCw size={18} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Consultor
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={selectedConsultor}
                  onChange={(e) => setSelectedConsultor(e.target.value)}
                >
                  <option value="todos">Todos os Consultores</option>
                  {consultores.map(consultor => (
                    <option key={consultor.id} value={consultor.id}>
                      {consultor.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-[#1a237e]">{reportData.conversionRate || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Receita Total</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    {formatCurrency(reportData.totalRevenue || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Ticket Médio</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    {formatCurrency(reportData.avgDealSize || 0)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-[#1a237e]">{reportData.activeClients || 0}</p>
                </div>
                <Users className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Simples e Funcionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Mês</CardTitle>
              <CardDescription>Volume de vendas e receita mensal - {reportData.salesByMonth?.length || 0} registros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reportData.salesByMonth || []).map((item, index) => {
                  const maxVendas = Math.max(...(reportData.salesByMonth || []).map(d => d.vendas))
                  const maxReceita = Math.max(...(reportData.salesByMonth || []).map(d => d.receita))
                  const vendaPercent = maxVendas > 0 ? (item.vendas / maxVendas) * 100 : 0
                  const receitaPercent = maxReceita > 0 ? (item.receita / maxReceita) * 100 : 0
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.month}</span>
                        <span className="text-muted-foreground">{item.vendas} vendas | {formatCurrency(item.receita)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#6a1b9a] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${vendaPercent}%` }}
                          />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-[#1a237e] h-1 rounded-full transition-all duration-500"
                            style={{ width: `${receitaPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-center space-x-4 text-xs mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#6a1b9a] rounded mr-1"></div>
                    <span>Vendas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#1a237e] rounded mr-1"></div>
                    <span>Receita</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status de Propostas */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Propostas</CardTitle>
              <CardDescription>Distribuição por status - {reportData.proposalsByStatus?.length || 0} categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reportData.proposalsByStatus || []).map((item, index) => {
                  const total = (reportData.proposalsByStatus || []).reduce((sum, d) => sum + d.count, 0)
                  const percentage = total > 0 ? (item.count / total) * 100 : 0
                  const color = COLORS[index % COLORS.length]
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{item.status}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Crescimento de Receita */}
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Receita</CardTitle>
              <CardDescription>Evolução mensal - Receita total: {formatCurrency(reportData.totalRevenue || 0)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reportData.revenueGrowth || []).map((item, index) => {
                  const maxReceita = Math.max(...(reportData.revenueGrowth || []).map(d => d.receita))
                  const receitaPercent = maxReceita > 0 ? (item.receita / maxReceita) * 100 : 0
                  const crescimentoColor = item.crescimento >= 0 ? '#4caf50' : '#f44336'
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.month}</span>
                        <div className="text-right">
                          <div>{formatCurrency(item.receita)}</div>
                          <div 
                            className="text-xs"
                            style={{ color: crescimentoColor }}
                          >
                            {item.crescimento >= 0 ? '+' : ''}{item.crescimento.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#6a1b9a] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${receitaPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance dos Consultores */}
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Consultores</CardTitle>
              <CardDescription>Taxa de conversão - {reportData.consultorPerformance?.length || 0} consultores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(reportData.consultorPerformance || []).map((item, index) => {
                  const maxPropostas = Math.max(...(reportData.consultorPerformance || []).map(d => d.propostas))
                  const maxReceita = Math.max(...(reportData.consultorPerformance || []).map(d => d.receita))
                  const propostasPercent = maxPropostas > 0 ? (item.propostas / maxPropostas) * 100 : 0
                  const aprovadaPercent = item.propostas > 0 ? (item.aprovadas / item.propostas) * 100 : 0
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate mr-2">{item.consultor}</span>
                        <div className="text-right text-xs">
                          <div>{item.propostas} propostas</div>
                          <div className="text-green-600">{item.aprovadas} aprovadas ({item.conversao}%)</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#6a1b9a] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${propostasPercent}%` }}
                          />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-[#4caf50] h-1 rounded-full transition-all duration-500"
                            style={{ width: `${aprovadaPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Receita: {formatCurrency(item.receita)}
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-center space-x-4 text-xs mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#6a1b9a] rounded mr-1"></div>
                    <span>Total Propostas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#4caf50] rounded mr-1"></div>
                    <span>Taxa de Conversão</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}