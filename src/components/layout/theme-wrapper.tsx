'use client'

import { useTheme } from '@/lib/use-theme'
import { useEffect } from 'react'

interface ThemeWrapperProps {
  children: React.ReactNode
}

export const ThemeWrapper = ({ children }: ThemeWrapperProps) => {
  const { variables, gender } = useTheme()
  
  useEffect(() => {
    // 应用CSS变量到根元素
    const root = document.documentElement
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // 添加性别主题类到body
    const body = document.body
    body.classList.remove('theme-male', 'theme-female')
    body.classList.add(`theme-${gender}`)
    
    // 清理函数
    return () => {
      Object.keys(variables).forEach(key => {
        root.style.removeProperty(key)
      })
      body.classList.remove('theme-male', 'theme-female')
    }
  }, [variables, gender])
  
  return <>{children}</>
}