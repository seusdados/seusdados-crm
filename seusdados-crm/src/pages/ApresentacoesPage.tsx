import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ApresentacoesManager } from '@/components/ApresentacoesManager'

export function ApresentacoesPage() {
  return (
    <DashboardLayout>
      <ApresentacoesManager />
    </DashboardLayout>
  )
}
