# Exemplos de Implementação - Módulo de Relatórios

## 🚀 Componentes de Gráficos Sugeridos

### 1. Dashboard com Gráficos - DashboardPage.tsx Melhorado

```typescript
import React, { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Componente de Gráfico de Vendas Mensais
export const SalesMonthlyChart = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Vendas Mensais</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#6a1b9a" 
            fill="#6a1b9a" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)

// Componente de Funil de Vendas
export const SalesFunnelChart = ({ data }: { data: any[] }) => {
  const COLORS = ['#6a1b9a', '#8e24aa', '#ab47bc', '#ba68c8']
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Componente de Performance por Consultor
export const ConsultorPerformanceChart = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Performance por Consultor</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="proposals" fill="#6a1b9a" />
          <Bar dataKey="contracts" fill="#ab47bc" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)
```

### 2. Hook Otimizado para Dados do Dashboard

```typescript
// hooks/useDashboardData.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardData {
  stats: {
    totalClients: number
    totalProposals: number
    activeContracts: number
    monthlyRevenue: number
    pendingProposals: number
    conversionRate: number
  }
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number }>
    salesFunnel: Array<{ name: string; value: number }>
    consultorPerformance: Array<{ name: string; proposals: number; contracts: number }>
  }
}

export const useDashboardData = (userRole: string, userId: string) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [userRole, userId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query otimizada com joins
      const { data: dashboardData, error: queryError } = await supabase.rpc(
        'get_dashboard_data',
        { 
          user_role: userRole, 
          user_id: userId 
        }
      )

      if (queryError) throw queryError

      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: loadDashboardData }
}
```

### 3. Função SQL Otimizada (Supabase)

```sql
-- Função para dados do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(user_role TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  client_filter TEXT;
BEGIN
  -- Definir filtro baseado no role
  IF user_role = 'admin' THEN
    client_filter := '';
  ELSIF user_role = 'consultor' THEN
    client_filter := 'WHERE p.consultant_id = ''' || user_id || '''';
  ELSE
    client_filter := 'WHERE p.client_id = ''' || user_id || '''';
  END IF;

  -- Query principal otimizada
  WITH dashboard_stats AS (
    SELECT 
      COUNT(DISTINCT c.id) as total_clients,
      COUNT(DISTINCT p.id) as total_proposals,
      COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'active') as active_contracts,
      COALESCE(SUM(ct.monthly_value) FILTER (WHERE ct.status = 'active'), 0) as monthly_revenue,
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'sent') as pending_proposals,
      CASE 
        WHEN COUNT(DISTINCT p.id) > 0 THEN 
          ROUND((COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'accepted')::FLOAT / COUNT(DISTINCT p.id)) * 100, 2)
        ELSE 0
      END as conversion_rate
    FROM clients c
    LEFT JOIN proposals p ON c.id = p.client_id
    LEFT JOIN contracts ct ON p.id = ct.proposal_id
  ),
  monthly_revenue AS (
    SELECT 
      TO_CHAR(ct.created_at, 'YYYY-MM') as month,
      SUM(ct.monthly_value) as revenue
    FROM contracts ct
    JOIN proposals p ON ct.proposal_id = p.id
    WHERE ct.status = 'active'
      AND ct.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(ct.created_at, 'YYYY-MM')
    ORDER BY month
  ),
  sales_funnel AS (
    SELECT 
      'Leads' as name, COUNT(*) as value
    FROM clients
    WHERE status = 'lead'
    UNION ALL
    SELECT 
      'Propostas Enviadas' as name, COUNT(*) as value
    FROM proposals
    WHERE status = 'sent'
    UNION ALL
    SELECT 
      'Propostas Aceitas' as name, COUNT(*) as value
    FROM proposals
    WHERE status = 'accepted'
    UNION ALL
    SELECT 
      'Contratos Ativos' as name, COUNT(*) as value
    FROM contracts
    WHERE status = 'active'
  ),
  consultor_performance AS (
    SELECT 
      u.full_name as name,
      COUNT(DISTINCT p.id) as proposals,
      COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'active') as contracts
    FROM users u
    LEFT JOIN proposals p ON u.id = p.consultant_id
    LEFT JOIN contracts ct ON p.id = ct.proposal_id
    WHERE u.role = 'consultor'
    GROUP BY u.id, u.full_name
  )
  
  -- Construir resultado JSON
  SELECT json_build_object(
    'stats', (SELECT row_to_json(dashboard_stats) FROM dashboard_stats),
    'charts', json_build_object(
      'monthlyRevenue', (SELECT json_agg(monthly_revenue) FROM monthly_revenue),
      'salesFunnel', (SELECT json_agg(sales_funnel) FROM sales_funnel),
      'consultorPerformance', (SELECT json_agg(consultor_performance) FROM consultor_performance)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 4. Componente de Filtros Avançados

```typescript
// components/ReportFilters.tsx
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, CalendarDays, Filter, Download } from 'lucide-react'

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilters) => void
  onExport: (format: 'pdf' | 'excel' | 'csv') => void
}

interface ReportFilters {
  dateRange: {
    start: Date
    end: Date
  }
  consultor?: string
  status?: string[]
  client?: string
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  onFilterChange, 
  onExport 
}) => {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
      end: new Date()
    }
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Filtro de Data */}
          <div>
            <label className="block text-sm font-medium mb-2">Período</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: new Date(e.target.value)
                })}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: new Date(e.target.value)
                })}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Filtro de Consultor */}
          <div>
            <label className="block text-sm font-medium mb-2">Consultor</label>
            <select
              value={filters.consultor || ''}
              onChange={(e) => handleFilterChange('consultor', e.target.value || undefined)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos os consultores</option>
              {/* Populate with consultors */}
            </select>
          </div>

          {/* Filtro de Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status?.[0] || ''}
              onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : undefined)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviada</option>
              <option value="accepted">Aceita</option>
              <option value="rejected">Rejeitada</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filtrar
            </Button>
          </div>

          {/* Botões de Exportação */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport('csv')}
            >
              <Download size={16} className="mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport('excel')}
            >
              <Download size={16} className="mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport('pdf')}
            >
              <Download size={16} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. Sistema de Exportação

```typescript
// utils/exportUtils.ts
export const exportToCSV = (data: any[], filename: string) => {
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export const exportToExcel = async (data: any[], filename: string) => {
  // Usar biblioteca como xlsx para exportar Excel
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export const exportToPDF = (element: HTMLElement, filename: string) => {
  // Usar biblioteca como jsPDF + html2canvas
  import('html2canvas').then(html2canvas => {
    import('jspdf').then(jsPDF => {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF.jsPDF()
        const imgWidth = 210
        const pageHeight = 295
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`${filename}.pdf`)
      })
    })
  })
}
```

### 6. Página de Relatórios Completa

```typescript
// pages/RelatoriosPage.tsx - Versão Completa
import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ReportFilters } from '@/components/ReportFilters'
import { SalesMonthlyChart, SalesFunnelChart, ConsultorPerformanceChart } from '@/components/Charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

export function RelatoriosPage() {
  const [filters, setFilters] = useState<ReportFilters>()
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (filters) {
      loadReportData(filters)
    }
  }, [filters])

  const loadReportData = async (filters: ReportFilters) => {
    setLoading(true)
    try {
      // Carregar dados baseado nos filtros
      const { data } = await supabase.rpc('get_report_data', filters)
      setReportData(data)
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implementar exportação baseada no formato
    console.log('Exportando como:', format)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a237e]">Relatórios</h1>
          <p className="text-[#5a647e] mt-1">
            Analytics e relatórios detalhados do sistema
          </p>
        </div>

        <ReportFilters
          onFilterChange={setFilters}
          onExport={handleExport}
        />

        <Tabs defaultValue="vendas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportData && (
                <>
                  <SalesMonthlyChart data={reportData.monthlyRevenue} />
                  <SalesFunnelChart data={reportData.salesFunnel} />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            {/* Relatórios financeiros */}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {reportData && (
              <ConsultorPerformanceChart data={reportData.consultorPerformance} />
            )}
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6">
            {/* Relatórios de clientes */}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
```

## 🚀 Próximos Passos

1. **Instalar dependências adicionais:**
   ```bash
   npm install xlsx jspdf html2canvas
   ```

2. **Implementar as funções SQL no Supabase**

3. **Criar os componentes de gráfico um por vez**

4. **Testar com dados de exemplo**

5. **Adicionar funcionalidades de exportação**

6. **Otimizar performance com cache e paginação**