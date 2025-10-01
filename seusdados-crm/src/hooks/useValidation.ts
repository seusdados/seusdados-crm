import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
  message?: string
  formatted?: string
}

export function useValidation() {
  const [validating, setValidating] = useState(false)

  const validateData = async (type: string, data: any): Promise<ValidationResult> => {
    try {
      setValidating(true)

      const { data: result, error } = await supabase.functions.invoke('validate-data', {
        body: { type, data }
      })

      if (error) {
        throw new Error(error.message || 'Erro na validação')
      }

      if (result?.error) {
        throw new Error(result.error.message || 'Erro na validação')
      }

      return result.data || { valid: false, message: 'Resultado inválido' }

    } catch (error: any) {
      console.error('Erro na validação:', error)
      return {
        valid: false,
        message: error.message || 'Erro interno na validação'
      }
    } finally {
      setValidating(false)
    }
  }

  // Validate CPF
  const validateCPF = async (cpf: string): Promise<ValidationResult> => {
    return await validateData('cpf', { cpf })
  }

  // Validate CNPJ
  const validateCNPJ = async (cnpj: string): Promise<ValidationResult> => {
    return await validateData('cnpj', { cnpj })
  }

  // Validate Email
  const validateEmail = async (email: string): Promise<ValidationResult> => {
    return await validateData('email', { email })
  }

  // Validate Phone
  const validatePhone = async (phone: string): Promise<ValidationResult> => {
    return await validateData('phone', { phone })
  }

  // Validate Client Data
  const validateClient = async (clientData: any): Promise<ValidationResult> => {
    return await validateData('client', clientData)
  }

  // Validate Proposal Data
  const validateProposal = async (proposalData: any): Promise<ValidationResult> => {
    return await validateData('proposal', proposalData)
  }

  // Validate Contract Data
  const validateContract = async (contractData: any): Promise<ValidationResult> => {
    return await validateData('contract', contractData)
  }

  // Client-side validations (faster for simple checks)
  const validateRequired = (value: any, fieldName: string): ValidationResult => {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return {
        valid: false,
        message: `${fieldName} é obrigatório`
      }
    }
    return { valid: true }
  }

  const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
    if (!value || value.length < minLength) {
      return {
        valid: false,
        message: `${fieldName} deve ter pelo menos ${minLength} caracteres`
      }
    }
    return { valid: true }
  }

  const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
    if (value && value.length > maxLength) {
      return {
        valid: false,
        message: `${fieldName} deve ter no máximo ${maxLength} caracteres`
      }
    }
    return { valid: true }
  }

  const validateNumeric = (value: any, fieldName: string): ValidationResult => {
    if (value && (isNaN(value) || Number(value) < 0)) {
      return {
        valid: false,
        message: `${fieldName} deve ser um número válido`
      }
    }
    return { valid: true }
  }

  const validateDate = (value: string, fieldName: string): ValidationResult => {
    if (value && isNaN(Date.parse(value))) {
      return {
        valid: false,
        message: `${fieldName} deve ser uma data válida`
      }
    }
    return { valid: true }
  }

  const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (end <= start) {
        return {
          valid: false,
          message: 'Data de fim deve ser posterior à data de início'
        }
      }
    }
    return { valid: true }
  }

  // Format functions (client-side)
  const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCNPJ = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Validate form with multiple fields
  const validateForm = async (formData: any, rules: any): Promise<{ valid: boolean; errors: Record<string, string> }> => {
    const errors: Record<string, string> = {}

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field]
      
      // Client-side validations first (faster)
      for (const rule of fieldRules as any[]) {
        let result: ValidationResult
        
        switch (rule.type) {
          case 'required':
            result = validateRequired(value, rule.message || field)
            break
          case 'minLength':
            result = validateMinLength(value, rule.value, rule.message || field)
            break
          case 'maxLength':
            result = validateMaxLength(value, rule.value, rule.message || field)
            break
          case 'numeric':
            result = validateNumeric(value, rule.message || field)
            break
          case 'date':
            result = validateDate(value, rule.message || field)
            break
          case 'email':
            result = await validateEmail(value)
            break
          case 'cpf':
            result = await validateCPF(value)
            break
          case 'cnpj':
            result = await validateCNPJ(value)
            break
          case 'phone':
            result = await validatePhone(value)
            break
          default:
            result = { valid: true }
        }
        
        if (!result.valid) {
          errors[field] = result.message || `${field} inválido`
          break // Stop at first error for this field
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  return {
    validating,
    validateData,
    validateCPF,
    validateCNPJ,
    validateEmail,
    validatePhone,
    validateClient,
    validateProposal,
    validateContract,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateNumeric,
    validateDate,
    validateDateRange,
    validateForm,
    formatCPF,
    formatCNPJ,
    formatPhone,
    formatCurrency
  }
}