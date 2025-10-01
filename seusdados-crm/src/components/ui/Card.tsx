import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  onClick?: () => void
}

export function Card({ className, children, variant = 'default', onClick }: CardProps) {
  const variantStyles = {
    default: 'bg-white rounded-lg border border-[#e0e4e8] shadow-sm',
    elevated: 'bg-white rounded-lg border border-[#e0e4e8] shadow-lg',
    outlined: 'bg-white rounded-lg border-2 border-[#e0e4e8] shadow-sm opacity-70'
  }
  
  return (
    <div 
      className={cn(variantStyles[variant], className, onClick && 'cursor-pointer')} 
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  className?: string
  children: React.ReactNode
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={cn('text-xl font-semibold leading-none tracking-tight text-[#333333]', className)}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-[#5a647e]', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  className?: string
  children: React.ReactNode
}

export function CardContent({ className, children }: CardContentProps) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  )
}
