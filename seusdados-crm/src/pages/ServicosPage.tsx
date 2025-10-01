import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase, Service } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface CreateServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service?: Service | null
}

function CreateServiceModal({ isOpen, onClose, onSuccess, service }: CreateServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    price_type: 'monthly',
    duration_months: '',
    features: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || '',
        base_price: service.base_price?.toString() || '',
        price_type: service.price_type,
        duration_months: service.duration_months?.toString() || '',
        features: service.features || []
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        base_price: '',
        price_type: 'monthly',
        duration_months: '',
        features: []
      })
    }
  }, [service, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        price_type: formData.price_type,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
        features: formData.features
      }

      if (service) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
        
        if (error) throw error
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([serviceData])
        
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar serviço')
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
            {service ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <p className="text-[#5a647e] mt-1">
            {service ? 'Atualize as informações do serviço' : 'Cadastre um novo serviço no catálogo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome do Serviço"
                placeholder="Ex: Implementação LGPD"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <Input
              label="Categoria"
              placeholder="Ex: Consultoria, Software, Treinamento"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Tipo de Preço
              </label>
              <select
                className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                value={formData.price_type}
                onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
              >
                <option value="monthly">Mensal</option>
                <option value="annual">Anual</option>
                <option value="one-time">Único</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <Input
              label="Preço Base (R$)"
              placeholder="1500.00"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
            />

            <Input
              label="Duração (meses)"
              placeholder="12"
              type="number"
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Descrição
            </label>
            <textarea
              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] h-24 resize-none"
              placeholder="Descrição detalhada do serviço..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              {service ? 'Atualizar' : 'Criar'} Serviço
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ServicosPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [priceTypeFilter, setPriceTypeFilter] = useState('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setServices(data || [])
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        (data || []).map(s => s.category).filter(Boolean)
      )] as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)

      if (error) throw error
      
      await loadServices()
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error)
    }
  }

  const handleDeleteService = async (service: Service) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error
      
      await loadServices()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'todas' || service.category === categoryFilter
    const matchesPriceType = priceTypeFilter === 'todos' || service.price_type === priceTypeFilter
    
    return matchesSearch && matchesCategory && matchesPriceType
  })

  const getPriceTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensal'
      case 'annual': return 'Anual'
      case 'one-time': return 'Único'
      case 'custom': return 'Personalizado'
      default: return type
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando serviços...</p>
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
            <h1 className="text-3xl font-bold text-[#1a237e]">Catálogo de Serviços</h1>
            <p className="text-[#5a647e] mt-1">
              Gerencie todos os serviços oferecidos pela empresa
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="mr-2" />
              Novo Serviço
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  icon={<Search size={18} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-3">
                <select
                  className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="todas">Todas as Categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <select
                  className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={priceTypeFilter}
                  onChange={(e) => setPriceTypeFilter(e.target.value)}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="monthly">Mensal</option>
                  <option value="annual">Anual</option>
                  <option value="one-time">Único</option>
                  <option value="custom">Personalizado</option>
                </select>
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
                  <p className="text-2xl font-bold text-[#1a237e]">{services.length}</p>
                </div>
                <Package className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {services.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Categorias</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {categories.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5a647e]">Preço Médio</p>
                  <p className="text-2xl font-bold text-[#1a237e]">
                    {formatCurrency(
                      services.reduce((sum, s) => sum + (s.base_price || 0), 0) / services.length || 0
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#6a1b9a]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length > 0 ? filteredServices.map((service) => (
            <Card key={service.id} variant={service.is_active ? 'default' : 'outlined'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2">
                        {service.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="ml-2"
                  >
                    {service.is_active ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {service.description && (
                  <p className="text-sm text-[#5a647e] line-clamp-3">
                    {service.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {service.base_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#5a647e]">Preço Base:</span>
                      <span className="font-medium text-[#1a237e]">
                        {formatCurrency(service.base_price)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5a647e]">Tipo:</span>
                    <span className="text-sm font-medium text-[#333333]">
                      {getPriceTypeLabel(service.price_type)}
                    </span>
                  </div>
                  
                  {service.duration_months && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#5a647e]">Duração:</span>
                      <span className="text-sm font-medium text-[#333333]">
                        {service.duration_months} meses
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteService(service)}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-[#5a647e] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-[#5a647e] mb-6">
                {searchTerm || categoryFilter !== 'todas' || priceTypeFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro serviço'
                }
              </p>
              {!searchTerm && categoryFilter === 'todas' && priceTypeFilter === 'todos' && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus size={18} className="mr-2" />
                  Criar Primeiro Serviço
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateServiceModal
        isOpen={showCreateModal || !!editingService}
        onClose={() => {
          setShowCreateModal(false)
          setEditingService(null)
        }}
        onSuccess={loadServices}
        service={editingService}
      />
    </DashboardLayout>
  )
}