import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DocumentUpload } from '@/components/DocumentUpload'
import { supabase, Client } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useExport } from '@/hooks/useExport'
import { useValidation } from '@/hooks/useValidation'
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit,
  Eye,
  Filter,
  Download,
  X,
  User,
  FileText,
  Upload as UploadIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ClienteViewer } from '../components/ClienteViewer'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
}

function CreateClientModal({ isOpen, onClose, onSuccess, client }: CreateClientModalProps) {
  const { user } = useAuth()
  const { validateClient, formatCNPJ, formatCPF, formatPhone } = useValidation()
  const [formData, setFormData] = useState({
    company_name: '',
    cnpj: '',
    company_type: '',
    main_activity: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    legal_representative_name: '',
    legal_representative_cpf: '',
    legal_representative_email: '',
    legal_representative_phone: '',
    status: 'lead' as 'lead' | 'active' | 'inactive' | 'prospect',
    lead_source: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showDocuments, setShowDocuments] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        cnpj: client.cnpj || '',
        company_type: client.company_type || '',
        main_activity: client.main_activity || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        legal_representative_name: client.legal_representative_name || '',
        legal_representative_cpf: client.legal_representative_cpf || '',
        legal_representative_email: client.legal_representative_email || '',
        legal_representative_phone: client.legal_representative_phone || '',
        status: client.status,
        lead_source: client.lead_source || '',
        notes: client.notes || ''
      })
    } else {
      setFormData({
        company_name: '',
        cnpj: '',
        company_type: '',
        main_activity: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        legal_representative_name: '',
        legal_representative_cpf: '',
        legal_representative_email: '',
        legal_representative_phone: '',
        status: 'lead',
        lead_source: '',
        notes: ''
      })
    }
    setError('')
  }, [client, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setValidationErrors([])

    try {
      // Validate client data
      const validation = await validateClient(formData)
      if (!validation.valid) {
        setValidationErrors(validation.errors || [])
        return
      }
      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            company_name: formData.company_name,
            cnpj: formData.cnpj || null,
            company_type: formData.company_type || null,
            main_activity: formData.main_activity || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            postal_code: formData.postal_code || null,
            legal_representative_name: formData.legal_representative_name || null,
            legal_representative_cpf: formData.legal_representative_cpf || null,
            legal_representative_email: formData.legal_representative_email || null,
            legal_representative_phone: formData.legal_representative_phone || null,
            status: formData.status,
            lead_source: formData.lead_source || null,
            notes: formData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id)
        
        if (error) throw error
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            company_name: formData.company_name,
            cnpj: formData.cnpj || null,
            company_type: formData.company_type || null,
            main_activity: formData.main_activity || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            postal_code: formData.postal_code || null,
            legal_representative_name: formData.legal_representative_name || null,
            legal_representative_cpf: formData.legal_representative_cpf || null,
            legal_representative_email: formData.legal_representative_email || null,
            legal_representative_phone: formData.legal_representative_phone || null,
            status: formData.status,
            lead_source: formData.lead_source || null,
            notes: formData.notes || null,
            user_id: user?.role === 'consultor' ? user.id : null // Associar ao consultor logado se for consultor
          }])
        
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error)
      setError(error.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">
                {client ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-[#5a647e] mt-1">
                {client ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#5a647e] hover:text-[#333333]"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dados da Empresa */}
          <div>
            <h3 className="text-lg font-semibold text-[#1a237e] mb-4 flex items-center">
              <Building2 size={20} className="mr-2" />
              Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome da Empresa"
                  placeholder="Ex: Empresa XYZ Ltda"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>
              
              <Input
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value)
                  setFormData({ ...formData, cnpj: formatted })
                }}
              />
              
              <Input
                label="Tipo de Empresa"
                placeholder="Ex: Ltda, S.A., MEI"
                value={formData.company_type}
                onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
              />
              
              <div className="md:col-span-2">
                <Input
                  label="Atividade Principal"
                  placeholder="Ex: Consultoria em tecnologia"
                  value={formData.main_activity}
                  onChange={(e) => setFormData({ ...formData, main_activity: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Endereço"
                  placeholder="Rua, Número, Bairro"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              
              <Input
                label="Cidade"
                placeholder="Ex: São Paulo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              
              <Input
                label="Estado"
                placeholder="Ex: SP"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              
              <Input
                label="CEP"
                placeholder="00000-000"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
          </div>

          {/* Representante Legal */}
          <div>
            <h3 className="text-lg font-semibold text-[#1a237e] mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Representante Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                placeholder="Ex: João Silva"
                value={formData.legal_representative_name}
                onChange={(e) => setFormData({ ...formData, legal_representative_name: e.target.value })}
              />
              
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={formData.legal_representative_cpf}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value)
                  setFormData({ ...formData, legal_representative_cpf: formatted })
                }}
              />
              
              <Input
                label="Email"
                type="email"
                placeholder="joao@empresa.com"
                value={formData.legal_representative_email}
                onChange={(e) => setFormData({ ...formData, legal_representative_email: e.target.value })}
              />
              
              <Input
                label="Telefone"
                placeholder="(11) 99999-9999"
                value={formData.legal_representative_phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData({ ...formData, legal_representative_phone: formatted })
                }}
              />
            </div>
          </div>

          {/* Informações Comerciais */}
          <div>
            <h3 className="text-lg font-semibold text-[#1a237e] mb-4 flex items-center">
              <FileText size={20} className="mr-2" />
              Informações Comerciais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              
              <Input
                label="Origem do Lead"
                placeholder="Ex: Website, Indicação, LinkedIn"
                value={formData.lead_source}
                onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
              />
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Observações
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] h-24 resize-none"
                  placeholder="Observações sobre o cliente..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium mb-2">Erros de validação:</p>
              <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents Section for existing clients */}
          {client && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1a237e] flex items-center">
                  <UploadIcon size={20} className="mr-2" />
                  Documentos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocuments(!showDocuments)}
                >
                  {showDocuments ? 'Ocultar' : 'Mostrar'} Documentos
                </Button>
              </div>
              
              {showDocuments && (
                <DocumentUpload
                  clientId={client.id}
                  onUploadSuccess={() => console.log('Documento enviado com sucesso')}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e0e4e8]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {client ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ClientesPageProps {
  isConsultor?: boolean
}

export function ClientesPage({ isConsultor = false }: ClientesPageProps) {
  const { user } = useAuth()
  const { exportTable, exporting } = useExport()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)

  useEffect(() => {
    loadClients()
  }, [user, statusFilter])

  const loadClients = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter)
      }

      // For consultores, show only their clients (if needed)
      // For now, we'll show all clients for both admin and consultor
      
      const { data, error } = await query

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.legal_representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cnpj?.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'lead':
        return 'bg-blue-100 text-blue-800'
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'lead':
        return 'Lead'
      case 'prospect':
        return 'Prospect'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const handleExport = async () => {
    const dataToExport = filteredClients.map(client => ({
      ...client,
      status_label: getStatusLabel(client.status),
      created_at: client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '',
      updated_at: client.updated_at ? new Date(client.updated_at).toLocaleDateString('pt-BR') : ''
    }))
    
    await exportTable('clients', dataToExport, `clientes_${new Date().toISOString().split('T')[0]}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando clientes...</p>
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
              {isConsultor ? 'Meus Clientes' : 'Clientes'}
            </h1>
            <p className="text-[#5a647e] mt-1">
              {isConsultor 
                ? 'Gerencie seus clientes atribuídos' 
                : 'Gerencie todos os clientes do sistema'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={handleExport}
              loading={exporting}
            >
              <Download size={18} className="mr-2" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por empresa, representante ou CNPJ..."
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
                  <option value="lead">Leads</option>
                  <option value="prospect">Prospects</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
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
                  <p className="text-2xl font-bold text-[#1a237e]">{clients.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Leads</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {clients.filter(c => c.status === 'lead').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Prospects</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {clients.filter(c => c.status === 'prospect').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {clients.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e4e8]">
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Empresa</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Representante</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Contato</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Localização</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-[#333333]">{client.company_name}</p>
                          {client.cnpj && (
                            <p className="text-sm text-[#5a647e]">CNPJ: {client.cnpj}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-[#333333]">
                            {client.legal_representative_name || '-'}
                          </p>
                          {client.legal_representative_cpf && (
                            <p className="text-sm text-[#5a647e]">
                              CPF: {client.legal_representative_cpf}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {client.legal_representative_email && (
                            <div className="flex items-center text-sm text-[#5a647e]">
                              <Mail size={14} className="mr-2" />
                              {client.legal_representative_email}
                            </div>
                          )}
                          {client.legal_representative_phone && (
                            <div className="flex items-center text-sm text-[#5a647e]">
                              <Phone size={14} className="mr-2" />
                              {client.legal_representative_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                          {getStatusLabel(client.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {client.city && client.state ? (
                          <div className="flex items-center text-sm text-[#5a647e]">
                            <MapPin size={14} className="mr-2" />
                            {client.city}, {client.state}
                          </div>
                        ) : (
                          <span className="text-[#5a647e]">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewingClient(client)}
                            title="Visualizar cliente"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingClient(client)}
                            title="Editar cliente"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Navegar para a página de documentos com o cliente pré-selecionado
                              navigate(`/documentos?client=${client.id}&tab=generate`)
                            }}
                            title="Gerar documento"
                            className="text-[#6a1b9a]"
                          >
                            <FileText size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5a647e]">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <CreateClientModal
        isOpen={showCreateModal || !!editingClient}
        onClose={() => {
          setShowCreateModal(false)
          setEditingClient(null)
        }}
        onSuccess={loadClients}
        client={editingClient}
      />

      {/* Cliente Viewer Modal */}
      {viewingClient && (
        <ClienteViewer
          clientId={viewingClient.id}
          isOpen={!!viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={() => {
            setEditingClient(viewingClient)
            setViewingClient(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}