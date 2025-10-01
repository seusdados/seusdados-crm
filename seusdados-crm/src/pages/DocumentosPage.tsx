import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DocumentosManager } from '@/components/DocumentosManager'

export function DocumentosPage() {
  return (
    <DashboardLayout>
      <DocumentosManager />
    </DashboardLayout>
  )
}
