import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase, Client, Service } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Search,
  Building2,
  Package,
  Calculator,
  Calendar,
  X,
  Check,
  ArrowLeft,
  Send
} from 'lucide-react'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface SelectedService {
  service: Service
  customPrice?: number
  discountPercentage?: number
  paymentMethod: string
  durationType: 'indefinite' | 'fixed_term'
  startDate?: string
  endDate?: string
  installmentConfig?: InstallmentConfig
}

interface InstallmentConfig {
  enabled: boolean
  type: 'equal' | 'down_payment_plus_installments'
  installments: number
  downPayment?: number
}

function CreateProposalModal({ isOpen, onClose, onSuccess }: CreateProposalModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: Client, 2: Services, 3: Review
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [searchClient, setSearchClient] = useState('')
  const [searchService, setSearchService] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposalData, setProposalData] = useState({
    paymentMethod: 'boleto',
    notes: '',
    installmentConfig: {
      enabled: false,
      type: 'equal' as 'equal' | 'down_payment_plus_installments',
      installments: 12,
      downPayment: 0
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadClients()
      loadServices()
    }
  }, [isOpen])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const handleAddService = (service: Service) => {
    const newSelectedService: SelectedService = {
      service,
      paymentMethod: service.price_type,
      durationType: 'indefinite'
    }
    setSelectedServices([...selectedServices, newSelectedService])
  }

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index))
  }

  const handleUpdateService = (index: number, updates: Partial<SelectedService>) => {
    const updated = [...selectedServices]
    updated[index] = { ...updated[index], ...updates }
    setSelectedServices(updated)
  }

  const calculateTotal = () => {
    return selectedServices.reduce((total, item) => {
      const basePrice = item.customPrice || item.service.base_price || 0
      const discount = item.discountPercentage || 0
      const finalPrice = basePrice * (1 - discount / 100)
      return total + finalPrice
    }, 0)
  }

  const calculateInstallments = () => {
    const total = calculateTotal()
    const config = proposalData.installmentConfig
    
    if (!config.enabled) return { total, installments: [] }
    
    if (config.type === 'equal') {
      const installmentValue = total / config.installments
      return {
        total,
        installments: Array.from({ length: config.installments }, (_, i) => ({
          number: i + 1,
          value: installmentValue,
          description: `${i + 1}ª parcela`
        }))
      }
    } else {
      const downPayment = config.downPayment || 0
      const remainingAmount = total - downPayment
      const installmentValue = remainingAmount / config.installments
      
      const installments = [{
        number: 0,
        value: downPayment,
        description: 'Entrada'
      }]
      
      for (let i = 1; i <= config.installments; i++) {
        installments.push({
          number: i,
          value: installmentValue,
          description: `${i}ª parcela`
        })
      }
      
      return { total, installments }
    }
  }

  const generateProposalNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getTime()).slice(-4)
    return `PROP-${year}${month}${day}-${time}`
  }

  const generateUniqueLink = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleCreateProposal = async () => {
    if (!selectedClient || selectedServices.length === 0) {
      setError('Selecione um cliente e pelo menos um serviço')
      return
    }

    try {
      setLoading(true)
      setError('')

      const proposalNumber = generateProposalNumber()
      const uniqueLink = generateUniqueLink()
      const totalAmount = calculateTotal()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

      // Create proposal
      const { data: insertedProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert([{
          proposal_number: proposalNumber,
          client_id: selectedClient.id,
          consultant_id: user?.id,
          status: 'draft',
          total_amount: totalAmount,
          currency: 'BRL',
          payment_method: proposalData.paymentMethod,
          unique_link: uniqueLink,
          expires_at: expiresAt.toISOString(),
          proposal_data: {
            services: selectedServices.map(item => ({
              service_id: item.service.id,
              service_name: item.service.name,
              base_price: item.service.base_price,
              custom_price: item.customPrice,
              discount_percentage: item.discountPercentage,
              payment_method: item.paymentMethod,
              duration_type: item.durationType,
              start_date: item.startDate,
              end_date: item.endDate
            })),
            notes: proposalData.notes,
            installmentConfig: proposalData.installmentConfig.enabled ? {
              ...proposalData.installmentConfig,
              installments: calculateInstallments().installments
            } : null
          }
        }])
        .select()
        .single()

      if (proposalError) throw proposalError

      // Create proposal services entries
      const proposalServices = selectedServices.map(item => ({
        proposal_id: insertedProposal.id,
        service_id: item.service.id,
        quantity: 1,
        unit_price: item.customPrice || item.service.base_price || 0,
        discount_percentage: item.discountPercentage || 0,
        payment_method: item.paymentMethod,
        duration_type: item.durationType,
        start_date: item.startDate,
        end_date: item.endDate
      }))

      const { error: servicesError } = await supabase
        .from('proposal_services')
        .insert(proposalServices)

      if (servicesError) throw servicesError

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Erro ao criar proposta')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedClient(null)
    setSelectedServices([])
    setSearchClient('')
    setSearchService('')
    setProposalData({ 
      paymentMethod: 'boleto', 
      notes: '',
      installmentConfig: {
        enabled: false,
        type: 'equal' as 'equal' | 'down_payment_plus_installments',
        installments: 12,
        downPayment: 0
      }
    })
    setError('')
  }

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchClient.toLowerCase())
  )

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchService.toLowerCase()) &&
    !selectedServices.some(selected => selected.service.id === service.id)
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">Nova Proposta</h2>
              <p className="text-[#5a647e] mt-1">
                Passo {step} de 3: {step === 1 ? 'Seleção do Cliente' : step === 2 ? 'Seleção de Serviços' : 'Revisão e Criação'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#5a647e] hover:text-[#333333]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map(stepNumber => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber < step ? 'bg-green-500 text-white' :
                  stepNumber === step ? 'bg-[#6a1b9a] text-white' :
                  'bg-[#e0e4e8] text-[#5a647e]'
                }`}>
                  {stepNumber < step ? <Check size={16} /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepNumber < step ? 'bg-green-500' : 'bg-[#e0e4e8]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Buscar cliente por nome da empresa..."
                icon={<Search size={18} />}
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredClients.map(client => (
                  <Card
                    key={client.id}
                    className={`cursor-pointer transition-all ${
                      selectedClient?.id === client.id
                        ? 'ring-2 ring-[#6a1b9a] bg-[#f7f8fc]'
                        : 'hover:bg-[#f7f8fc]'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#6a1b9a] rounded-lg flex items-center justify-center text-white font-medium">
                          <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#333333]">{client.company_name}</h3>
                          <p className="text-sm text-[#5a647e]">
                            {client.legal_representative_name || 'Sem representante'}
                          </p>
                        </div>
                        {selectedClient?.id === client.id && (
                          <Check className="w-5 h-5 text-[#6a1b9a]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#1a237e] mb-3">Serviços Selecionados</h3>
                  <div className="space-y-3">
                    {selectedServices.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-[#333333]">{item.service.name}</h4>
                              <p className="text-sm text-[#5a647e] mb-3">{item.service.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-[#5a647e] block mb-1">Preço (R$)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-2 py-1 text-sm border border-[#e0e4e8] rounded"
                                    value={item.customPrice || item.service.base_price || ''}
                                    onChange={(e) => handleUpdateService(index, {
                                      customPrice: parseFloat(e.target.value) || undefined
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs text-[#5a647e] block mb-1">Desconto (%)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full px-2 py-1 text-sm border border-[#e0e4e8] rounded"
                                    value={item.discountPercentage || ''}
                                    onChange={(e) => handleUpdateService(index, {
                                      discountPercentage: parseFloat(e.target.value) || undefined
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs text-[#5a647e] block mb-1">Tipo de Duração</label>
                                  <select
                                    className="w-full px-2 py-1 text-sm border border-[#e0e4e8] rounded"
                                    value={item.durationType}
                                    onChange={(e) => handleUpdateService(index, {
                                      durationType: e.target.value as 'indefinite' | 'fixed_term'
                                    })}
                                  >
                                    <option value="indefinite">Indeterminado</option>
                                    <option value="fixed_term">Prazo Fixo</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveService(index)}
                              className="ml-4 text-red-600 hover:text-red-800"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Services */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a237e] mb-3">Adicionar Serviços</h3>
                <Input
                  placeholder="Buscar serviços..."
                  icon={<Search size={18} />}
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="mb-4"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {filteredServices.map(service => (
                    <Card key={service.id} className="hover:bg-[#f7f8fc] cursor-pointer" onClick={() => handleAddService(service)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#6a1b9a] rounded-lg flex items-center justify-center text-white">
                            <Package size={16} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-[#333333]">{service.name}</h4>
                            <p className="text-sm text-[#5a647e]">
                              {service.base_price ? formatCurrency(service.base_price) : 'Preço sob consulta'}
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-[#6a1b9a]" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Review */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a237e] mb-3">Resumo da Proposta</h3>
                
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedClient?.company_name}</p>
                    <p className="text-sm text-[#5a647e]">{selectedClient?.legal_representative_name}</p>
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Serviços ({selectedServices.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedServices.map((item, index) => {
                        const basePrice = item.customPrice || item.service.base_price || 0
                        const discount = item.discountPercentage || 0
                        const finalPrice = basePrice * (1 - discount / 100)
                        
                        return (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{item.service.name}</span>
                              {discount > 0 && (
                                <span className="ml-2 text-sm text-green-600">(-{discount}%)</span>
                              )}
                            </div>
                            <span className="font-medium">{formatCurrency(finalPrice)}</span>
                          </div>
                        )
                      })}
                      <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-[#1a237e]">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção de Parcelamento */}
                <Card className="mb-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Opções de Parcelamento</CardTitle>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableInstallments"
                          checked={proposalData.installmentConfig.enabled}
                          onChange={(e) => setProposalData({
                            ...proposalData,
                            installmentConfig: {
                              ...proposalData.installmentConfig,
                              enabled: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-[#6a1b9a] focus:ring-[#6a1b9a] border-gray-300 rounded"
                        />
                        <label htmlFor="enableInstallments" className="text-sm font-medium text-[#333333]">
                          Habilitar Parcelamento
                        </label>
                      </div>
                    </div>
                  </CardHeader>
                  {proposalData.installmentConfig.enabled && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                              Modalidade de Parcelamento
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                              value={proposalData.installmentConfig.type}
                              onChange={(e) => setProposalData({
                                ...proposalData,
                                installmentConfig: {
                                  ...proposalData.installmentConfig,
                                  type: e.target.value as 'equal' | 'down_payment_plus_installments'
                                }
                              })}
                            >
                              <option value="equal">Parcelas Iguais</option>
                              <option value="down_payment_plus_installments">Entrada + Parcelas Iguais</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                              Número de Parcelas
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                              value={proposalData.installmentConfig.installments}
                              onChange={(e) => setProposalData({
                                ...proposalData,
                                installmentConfig: {
                                  ...proposalData.installmentConfig,
                                  installments: parseInt(e.target.value) || 1
                                }
                              })}
                            />
                          </div>
                        </div>
                        
                        {proposalData.installmentConfig.type === 'down_payment_plus_installments' && (
                          <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                              Valor da Entrada (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={calculateTotal()}
                              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                              value={proposalData.installmentConfig.downPayment || ''}
                              onChange={(e) => setProposalData({
                                ...proposalData,
                                installmentConfig: {
                                  ...proposalData.installmentConfig,
                                  downPayment: parseFloat(e.target.value) || 0
                                }
                              })}
                              placeholder="0.00"
                            />
                          </div>
                        )}
                        
                        {/* Preview do Parcelamento */}
                        <div className="bg-[#f7f8fc] rounded-lg p-4">
                          <h4 className="font-medium text-[#1a237e] mb-3">Preview do Parcelamento:</h4>
                          <div className="space-y-2">
                            {(() => {
                              const { installments } = calculateInstallments()
                              return installments.map((installment, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm text-[#333333]">{installment.description}:</span>
                                  <span className="font-medium text-[#1a237e]">
                                    {formatCurrency(installment.value)}
                                  </span>
                                </div>
                              ))
                            })()}
                            <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                              <span>Total Geral:</span>
                              <span className="text-[#1a237e]">{formatCurrency(calculateTotal())}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] h-24 resize-none"
                    placeholder="Observações adicionais sobre a proposta..."
                    value={proposalData.notes}
                    onChange={(e) => setProposalData({ ...proposalData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#e0e4e8] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !selectedClient || step === 2 && selectedServices.length === 0}
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleCreateProposal}
                loading={loading}
              >
                <Send size={16} className="mr-2" />
                Criar Proposta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { CreateProposalModal }