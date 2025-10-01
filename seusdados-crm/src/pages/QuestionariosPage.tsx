import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { QuestionariosManager } from '@/components/QuestionariosManager'

export function QuestionariosPage() {
  return (
    <DashboardLayout>
      <QuestionariosManager />
    </DashboardLayout>
  )
}
