import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase, User } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Search,
  Filter,
  Download,
  Eye,
  ToggleLeft,
  ToggleRight,
  Building2,
  User as UserIcon,
  X
} from 'lucide-react'

interface CreateConsultorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  consultor?: User | null
}

function CreateConsultorModal({ isOpen, onClose, onSuccess, consultor }: CreateConsultorModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    department: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (consultor) {
      setFormData({
        email: consultor.email,
        full_name: consultor.full_name,
        phone: consultor.phone || '',
        department: consultor.department || '',
        password: '' // Never populate password field
      })
    } else {
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        department: '',
        password: ''
      })
    }
  }, [consultor, isOpen])

  const createConsultorWithTimeout = async (userData: any) => {
    // Implementar timeout de 10 segundos
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operação excedeu 10 segundos')), 10000)
    })

    const createPromise = supabase.functions.invoke('create-consultor-simple', {
      body: {
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        role: 'consultor',
        phone: userData.phone,
        department: userData.department
      }
    })

    return Promise.race([createPromise, timeoutPromise])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (consultor) {
        // Update existing consultor
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            department: formData.department || null
          })
          .eq('id', consultor.id)
        
        if (error) throw error
      } else {
        // Create new consultor usando edge function mais robusta
        const { data: response, error: functionError } = await createConsultorWithTimeout(formData)
        
        if (functionError) {
          console.error('Function error:', functionError)
          throw new Error(`Erro ao criar consultor: ${functionError.message}`)
        }

        if (response && response.error) {
          console.error('Response error:', response.error)
          throw new Error(response.error.message || 'Erro desconhecido ao criar consultor')
        }

        // Verificar se o usuário foi criado com sucesso
        if (response && !response.success) {
          throw new Error('Falha na criação do consultor')
        }
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating/updating consultor:', error)
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro ao salvar consultor'
      
      if (error.message) {
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = 'Operação demorou muito para responder. Tente novamente.'
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado no sistema.'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.'
        } else if (error.message.includes('Password')) {
          errorMessage = 'Senha deve ter pelo menos 6 caracteres.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <h2 className="text-2xl font-bold text-[#1a237e]">
            {consultor ? 'Editar Consultor' : 'Novo Consultor'}
          </h2>
          <p className="text-[#5a647e] mt-1">
            {consultor ? 'Atualize as informações do consultor' : 'Cadastre um novo consultor no sistema'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              placeholder="Ex: João Silva"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="joao@seusdados.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!consultor} // Can't change email after creation
              required
            />

            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Departamento"
              placeholder="Ex: Vendas, Consultoria"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />

            {!consultor && (
              <div className="md:col-span-2">
                <Input
                  label="Senha Temporária"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <p className="text-xs text-[#5a647e] mt-1">
                  O consultor deverá alterar a senha no primeiro acesso
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
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
              {consultor ? 'Atualizar' : 'Criar'} Consultor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ConsultoresPage() {
  const { user } = useAuth()
  const [consultores, setConsultores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingConsultor, setEditingConsultor] = useState<User | null>(null)
  const [viewingConsultor, setViewingConsultor] = useState<User | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalProposals: 0,
    totalContracts: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    loadConsultores()
  }, [])

  const loadConsultores = async () => {
    try {
      setLoading(true)
      
      // Usar edge function para buscar consultores via Auth Admin API
      const { data: response, error: functionError } = await supabase.functions.invoke('get-consultores-auth', {
        body: { role: 'consultor' }
      })
      
      if (functionError) {
        console.error('Function error:', functionError)
        throw functionError
      }

      if (response && response.error) {
        console.error('Response error:', response.error)
        throw new Error(response.error.message)
      }

      const consultores = response?.data || []
      setConsultores(consultores)
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(
        consultores.map(c => c.department).filter(Boolean)
      )] as string[]
      setDepartments(uniqueDepartments)

      // Load consultant stats
      await loadConsultorStats(consultores)
    } catch (error) {
      console.error('Erro ao carregar consultores:', error)
      // Fallback: tentar buscar diretamente se a function falhar
      try {
        console.log('Tentando fallback direto...')
        const { data, error: directError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'consultor')
          .order('created_at', { ascending: false })

        if (directError) throw directError
        
        setConsultores(data || [])
        
        const uniqueDepartments = [...new Set(
          (data || []).map(c => c.department).filter(Boolean)
        )] as string[]
        setDepartments(uniqueDepartments)
        
        await loadConsultorStats(data || [])
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError)
        // Se tudo falhar, mostrar lista vazia
        setConsultores([])
        setDepartments([])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadConsultorStats = async (consultorList: User[]) => {
    try {
      const consultorIds = consultorList.map(c => c.id)
      
      if (consultorIds.length === 0) return

      // Load proposals count
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('consultant_id, total_amount')
        .in('consultant_id', consultorIds)

      // Load contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')

      // Calculate stats
      const totalProposals = proposalsData?.length || 0
      const totalContracts = contractsData?.length || 0
      const totalRevenue = contractsData
        ?.filter(c => c.status === 'active')
        ?.reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0

      setStats({
        totalProposals,
        totalContracts,
        totalRevenue
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleToggleActive = async (consultor: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !consultor.is_active })
        .eq('id', consultor.id)

      if (error) throw error
      
      await loadConsultores()
    } catch (error) {
      console.error('Erro ao alterar status do consultor:', error)
    }
  }

  const handleDeleteConsultor = async (consultor: User) => {
    if (!confirm('Tem certeza que deseja excluir este consultor? Esta ação não pode ser desfeita.')) return

    try {
      setLoading(true)

      // Usar edge function para deletar via Auth Admin API
      const { data: response, error: functionError } = await supabase.functions.invoke('delete-consultor', {
        body: {
          consultor_id: consultor.id
        }
      })
      
      if (functionError) {
        console.error('Function error:', functionError)
        throw new Error(functionError.message || 'Erro ao excluir consultor')
      }

      if (response && response.error) {
        console.error('Response error:', response.error)
        throw new Error(response.error.message || 'Erro desconhecido ao excluir consultor')
      }

      // Verificar se a exclusão foi bem-sucedida
      if (response && !response.success) {
        throw new Error('Falha na exclusão do consultor')
      }

      // Recarregar a lista de consultores
      await loadConsultores()
      
      // Mostrar mensagem de sucesso
      alert('Consultor excluído com sucesso!')
      
    } catch (error: any) {
      console.error('Erro ao excluir consultor:', error)
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro ao excluir consultor'
      
      if (error.message) {
        if (error.message.includes('propostas associadas')) {
          errorMessage = 'Não é possível excluir este consultor pois ele possui propostas associadas.'
        } else if (error.message.includes('não encontrado')) {
          errorMessage = 'Consultor não encontrado.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredConsultores = consultores.filter(consultor => {
    const matchesSearch = consultor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultor.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'todos' || consultor.department === departmentFilter
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'ativo' && consultor.is_active) ||
                         (statusFilter === 'inativo' && !consultor.is_active)
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

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
            <p className="text-[#5a647e]">Carregando consultores...</p>
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
            <h1 className="text-3xl font-bold text-[#1a237e]">Consultores</h1>
            <p className="text-[#5a647e] mt-1">
              Gerencie a equipe de consultores do sistema
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus size={18} className="mr-2" />
              Novo Consultor
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou email..."
                  icon={<Search size={18} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-3">
                <select
                  className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="todos">Todos os Departamentos</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                
                <select
                  className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
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
                  <p className="text-sm text-[#5a647e] font-medium">Total de Consultores</p>
                  <p className="text-2xl font-bold text-[#1a237e]">{consultores.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {consultores.filter(c => c.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Propostas Criadas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalProposals}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e] font-medium">Receita Gerada</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultores Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Consultores</CardTitle>
            <CardDescription>
              {filteredConsultores.length} {filteredConsultores.length === 1 ? 'consultor encontrado' : 'consultores encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e4e8]">
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Consultor</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Contato</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Departamento</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Criado em</th>
                    <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultores.length > 0 ? filteredConsultores.map((consultor) => (
                    <tr key={consultor.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-full flex items-center justify-center text-white font-medium">
                            {consultor.full_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#333333]">{consultor.full_name}</p>
                            <p className="text-sm text-[#5a647e]">{consultor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-[#5a647e]">
                            <Mail size={14} className="mr-2" />
                            {consultor.email}
                          </div>
                          {consultor.phone && (
                            <div className="flex items-center text-sm text-[#5a647e]">
                              <Phone size={14} className="mr-2" />
                              {consultor.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-[#333333]">
                          {consultor.department || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            consultor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {consultor.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            onClick={() => handleToggleActive(consultor)}
                            className="text-[#5a647e] hover:text-[#333333]"
                          >
                            {consultor.is_active ? (
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-[#5a647e]">
                          {formatDate(consultor.created_at)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewingConsultor(consultor)}
                            title="Visualizar detalhes"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingConsultor(consultor)}
                            title="Editar consultor"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteConsultor(consultor)}
                            title="Excluir consultor"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#5a647e]">
                        {searchTerm || departmentFilter !== 'todos' || statusFilter !== 'todos'
                          ? 'Nenhum consultor encontrado com os filtros aplicados'
                          : 'Nenhum consultor cadastrado'
                        }
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
      <CreateConsultorModal
        isOpen={showCreateModal || !!editingConsultor}
        onClose={() => {
          setShowCreateModal(false)
          setEditingConsultor(null)
        }}
        onSuccess={loadConsultores}
        consultor={editingConsultor}
      />

      {/* Modal de Visualização de Consultor */}
      {viewingConsultor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e0e4e8]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a237e]">
                    Detalhes do Consultor
                  </h2>
                  <p className="text-[#5a647e] mt-1">
                    Informações completas do consultor
                  </p>
                </div>
                <button
                  onClick={() => setViewingConsultor(null)}
                  className="text-[#5a647e] hover:text-[#333333]"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5" />
                      <span>Informações Pessoais</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Nome</label>
                      <p className="text-[#333333]">{viewingConsultor.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Email</label>
                      <p className="text-[#333333]">{viewingConsultor.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Telefone</label>
                      <p className="text-[#333333]">{viewingConsultor.phone || 'Não informado'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span>Informações Profissionais</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Departamento</label>
                      <p className="text-[#333333]">{viewingConsultor.department || 'Não definido'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Status</label>
                      <p className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        viewingConsultor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingConsultor.is_active ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Data de Criação</label>
                      <p className="text-[#333333]">
                        {new Date(viewingConsultor.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setViewingConsultor(null)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setEditingConsultor(viewingConsultor)
                  setViewingConsultor(null)
                }}>
                  Editar Consultor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}