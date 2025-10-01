import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientesPage } from '@/pages/ClientesPage'
import { ConsultoresPage } from '@/pages/ConsultoresPage'
import { ServicosPage } from '@/pages/ServicosPage'
import { PropostasPage } from '@/pages/PropostasPage'
import { ContratosPage } from '@/pages/ContratosPage'
import { DocumentosPage } from '@/pages/DocumentosPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'
import { ApresentacoesPage } from '@/pages/ApresentacoesPage'
import { QuestionariosPage } from '@/pages/QuestionariosPage'

import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/consultores"
            element={
              <ProtectedRoute roles={['admin']}>
                <ConsultoresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute roles={['admin']}>
                <ClientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/servicos"
            element={
              <ProtectedRoute roles={['admin']}>
                <ServicosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documentos"
            element={
              <ProtectedRoute roles={['admin', 'consultor']}>
                <DocumentosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apresentacoes"
            element={
              <ProtectedRoute roles={['admin', 'consultor']}>
                <ApresentacoesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questionarios"
            element={
              <ProtectedRoute roles={['admin', 'consultor']}>
                <QuestionariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute roles={['admin']}>
                <RelatoriosPage />
              </ProtectedRoute>
            }
          />


          {/* Consultor routes */}
          <Route
            path="/meus-clientes"
            element={
              <ProtectedRoute roles={['consultor']}>
                <ClientesPage isConsultor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propostas"
            element={
              <ProtectedRoute roles={['consultor', 'admin']}>
                <PropostasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contratos"
            element={
              <ProtectedRoute roles={['consultor', 'admin']}>
                <ContratosPage />
              </ProtectedRoute>
            }
          />

          {/* Cliente routes */}
          <Route
            path="/area-cliente"
            element={
              <ProtectedRoute roles={['cliente']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-propostas"
            element={
              <ProtectedRoute roles={['cliente']}>
                <PropostasPage isCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-contratos"
            element={
              <ProtectedRoute roles={['cliente']}>
                <ContratosPage isCliente />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App