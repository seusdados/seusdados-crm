import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f5f5fa] flex items-center justify-center p-6">
      <Card variant="elevated" className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}