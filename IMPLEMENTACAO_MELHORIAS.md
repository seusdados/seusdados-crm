# Implementação das Melhorias - Guia Técnico

## 🚀 Setup Rápido de Testes (Prioridade Máxima)

### 1. Instalação das Dependências
```bash
# Instalar dependências de teste
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Instalar tipos
pnpm add -D @types/testing-library__jest-dom
```

### 2. Configuração do Vitest

**`vite.config.ts`** (adicionar):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**`src/test/setup.ts`**:
```typescript
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
```

### 3. Exemplos de Testes Essenciais

**`src/components/ui/__tests__/Button.test.tsx`**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies correct variant styles', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })
})
```

**`src/contexts/__tests__/AuthContext.test.tsx`**:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}))

function TestComponent() {
  const { user, loading } = useAuth()
  return (
    <div>
      {loading ? 'Loading...' : user ? `Hello ${user.email}` : 'Not authenticated'}
    </div>
  )
}

describe('AuthContext', () => {
  it('provides authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

**`package.json`** (adicionar scripts):
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🔧 Error Monitoring com Sentry

### 1. Instalação
```bash
pnpm add @sentry/react @sentry/tracing
```

### 2. Configuração

**`src/lib/sentry.ts`**:
```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: 1.0,
    beforeSend(event) {
      // Filtrar informações sensíveis
      if (event.user) {
        delete event.user.email
      }
      return event
    }
  })
}

export { Sentry }
```

**`src/main.tsx`** (atualizar):
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/sentry' // Adicionar

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 3. Logger Estruturado

**`src/lib/logger.ts`**:
```typescript
import { Sentry } from './sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDev = import.meta.env.DEV

  private log(level: LogLevel, message: string, context?: LogContext) {
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context
    }

    if (this.isDev) {
      console[level](message, context)
    }

    // Enviar apenas erros para Sentry em produção
    if (level === 'error' && !this.isDev) {
      Sentry.captureException(new Error(message), {
        extra: context
      })
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    })
  }
}

export const logger = new Logger()
```

**Uso no código (exemplo no AuthContext):**
```typescript
import { logger } from '@/lib/logger'

// Substituir console.log por
logger.info('User profile loaded successfully', {
  userId: data.id,
  role: data.role
})

// Substituir console.error por
logger.error('Error getting user profile', error, {
  action: 'getUserProfile',
  userId: authUser?.id
})
```

---

## ⚡ Performance Optimization

### 1. React.memo para Componentes

**`src/components/ui/Button.tsx`** (otimizar):
```typescript
import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    // ... resto da implementação
  }
))

Button.displayName = 'Button'
export { Button }
```

### 2. Code Splitting

**`src/App.tsx`** (lazy loading):
```typescript
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'

// Lazy load das páginas
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const ClientesPage = React.lazy(() => import('@/pages/ClientesPage'))
const ConsultoresPage = React.lazy(() => import('@/pages/ConsultoresPage'))
// ... outras páginas

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent" />
          </div>
        }>
          <Routes>
            {/* ... rotas */}
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
```

### 3. Cache com React Query

```bash
pnpm add @tanstack/react-query
```

**`src/lib/queryClient.ts`**:
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false
        return failureCount < 3
      }
    }
  }
})
```

---

## 🔒 Environment Variables

### 1. Configuração Segura

**`.env.example`**:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sentry (opcional)
VITE_SENTRY_DSN=your_sentry_dsn

# Environment
VITE_APP_ENV=development
```

**`src/lib/env.ts`**:
```typescript
import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development')
})

const env = envSchema.parse(import.meta.env)

export { env }
```

**`src/lib/supabase.ts`** (atualizar):
```typescript
import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)

// ... resto das interfaces permanecem iguais
```

---

## 🎯 Acessibilidade

### 1. ARIA Labels nos Componentes

**`src/components/ui/Button.tsx`** (melhorar):
```typescript
const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    children, 
    disabled, 
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-label={loading ? 'Carregando...' : ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <div 
            className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" 
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    )
  }
))
```

### 2. Skip Links

**`src/components/SkipLinks.tsx`**:
```typescript
import React from 'react'

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a 
        href="#main-content" 
        className="absolute top-0 left-0 bg-blue-600 text-white px-4 py-2 z-50 focus:relative"
      >
        Pular para o conteúdo principal
      </a>
      <a 
        href="#navigation" 
        className="absolute top-0 left-20 bg-blue-600 text-white px-4 py-2 z-50 focus:relative"
      >
        Pular para a navegação
      </a>
    </div>
  )
}
```

---

## 🔍 Health Checks

### 1. Health Check Endpoint

**`public/health.json`**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-27T23:43:24Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Service Health Hook

**`src/hooks/useHealthCheck.ts`**:
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      return {
        database: 'healthy',
        timestamp: new Date().toISOString()
      }
    },
    refetchInterval: 30000, // 30 segundos
    retry: 3
  })
}
```

---

## 📋 Checklist de Implementação

### Semana 1 - Crítico
- [ ] Configurar Vitest e React Testing Library
- [ ] Escrever testes para componentes UI (Button, Input, Card)
- [ ] Escrever testes para AuthContext
- [ ] Configurar environment variables
- [ ] Implementar Sentry
- [ ] Criar logger estruturado
- [ ] Remover console.logs do código

### Semana 2 - Importante
- [ ] Implementar React.memo nos componentes
- [ ] Configurar code splitting
- [ ] Adicionar ARIA labels
- [ ] Implementar skip links
- [ ] Configurar React Query
- [ ] Otimizar queries Supabase

### Semana 3 - Melhorias
- [ ] Health checks
- [ ] Documentação JSDoc
- [ ] Testes de integração
- [ ] Performance monitoring
- [ ] Security headers

### Semana 4 - Finalização
- [ ] E2E tests
- [ ] Pipeline CI/CD
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation completa

---

## 🚀 Scripts de Deploy

**`scripts/deploy.sh`**:
```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Build
echo "📦 Building..."
pnpm run build:prod

# Tests
echo "🧪 Running tests..."
pnpm run test:coverage

# Security check
echo "🔒 Security audit..."
pnpm audit --audit-level high

# Deploy
echo "🌐 Deploying..."
# Comando específico do seu provedor

echo "✅ Deploy completed!"
```

Este guia fornece implementação prática para as principais melhorias identificadas na auditoria. Comece pelas melhorias críticas (testes e monitoring) antes de avançar para as otimizações.
