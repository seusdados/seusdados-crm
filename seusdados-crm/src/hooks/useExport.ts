import { useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ExportOptions {
  filename?: string
  format?: 'csv' | 'excel'
  columns?: { key: string; label: string }[]
}

export function useExport() {
  const [exporting, setExporting] = useState(false)

  const exportData = async (data: any[], options: ExportOptions = {}) => {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    try {
      setExporting(true)
      const { filename = 'export', format = 'csv', columns } = options

      // Transform data if columns are specified
      let processedData = data
      if (columns && columns.length > 0) {
        processedData = data.map(item => {
          const newItem: any = {}
          columns.forEach(col => {
            newItem[col.label] = getNestedValue(item, col.key)
          })
          return newItem
        })
      }

      // Clean data - remove null/undefined values and format dates
      processedData = processedData.map(item => {
        const cleanItem: any = {}
        Object.keys(item).forEach(key => {
          let value = item[key]
          
          // Handle null/undefined
          if (value === null || value === undefined) {
            value = ''
          }
          // Handle dates
          else if (value instanceof Date) {
            value = value.toLocaleDateString('pt-BR')
          }
          // Handle date strings
          else if (typeof value === 'string' && isDateString(value)) {
            value = new Date(value).toLocaleDateString('pt-BR')
          }
          // Handle objects/arrays
          else if (typeof value === 'object') {
            value = JSON.stringify(value)
          }
          
          cleanItem[key] = value
        })
        return cleanItem
      })

      if (format === 'csv') {
        exportCSV(processedData, filename)
      } else {
        exportExcel(processedData, filename)
      }

    } catch (error) {
      console.error('Erro na exportação:', error)
      alert('Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  const exportCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data, {
      header: true,
      delimiter: ';' // Excel-friendly delimiter for Portuguese locale
    })

    // Add BOM for proper UTF-8 handling in Excel
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${filename}.csv`)
  }

  const exportExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados')
    
    // Auto-fit columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const colWidths: any[] = []
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = worksheet[cellAddress]
        if (cell && cell.v) {
          const cellWidth = cell.v.toString().length
          maxWidth = Math.max(maxWidth, cellWidth)
        }
      }
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
    }
    worksheet['!cols'] = colWidths

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    downloadBlob(blob, `${filename}.xlsx`)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  const isDateString = (value: string): boolean => {
    // Check if string looks like an ISO date
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    return isoRegex.test(value) && !isNaN(Date.parse(value))
  }

  // Predefined column mappings for common tables
  const getColumnMapping = (tableType: string) => {
    switch (tableType) {
      case 'clients':
        return [
          { key: 'company_name', label: 'Empresa' },
          { key: 'cnpj', label: 'CNPJ' },
          { key: 'legal_representative_name', label: 'Representante Legal' },
          { key: 'legal_representative_email', label: 'Email' },
          { key: 'legal_representative_phone', label: 'Telefone' },
          { key: 'city', label: 'Cidade' },
          { key: 'state', label: 'Estado' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Data de Cadastro' }
        ]
      
      case 'proposals':
        return [
          { key: 'proposal_number', label: 'Número da Proposta' },
          { key: 'clients.company_name', label: 'Cliente' },
          { key: 'users.full_name', label: 'Consultor' },
          { key: 'total_amount', label: 'Valor Total' },
          { key: 'status', label: 'Status' },
          { key: 'payment_method', label: 'Forma de Pagamento' },
          { key: 'created_at', label: 'Data de Criação' },
          { key: 'accepted_at', label: 'Data de Aceitação' }
        ]
      
      case 'contracts':
        return [
          { key: 'contract_number', label: 'Número do Contrato' },
          { key: 'clients.company_name', label: 'Cliente' },
          { key: 'total_value', label: 'Valor Total' },
          { key: 'status', label: 'Status' },
          { key: 'start_date', label: 'Data de Início' },
          { key: 'end_date', label: 'Data de Término' },
          { key: 'created_at', label: 'Data de Criação' }
        ]
      
      case 'users':
        return [
          { key: 'full_name', label: 'Nome Completo' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Função' },
          { key: 'is_active', label: 'Ativo' },
          { key: 'created_at', label: 'Data de Cadastro' }
        ]
      
      default:
        return undefined
    }
  }

  const exportTable = async (tableType: string, data: any[], customFilename?: string) => {
    const columns = getColumnMapping(tableType)
    const filename = customFilename || `${tableType}_${new Date().toISOString().split('T')[0]}`
    
    await exportData(data, {
      filename,
      format: 'excel',
      columns
    })
  }

  return {
    exportData,
    exportTable,
    exporting
  }
}