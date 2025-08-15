'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Loader2, Heart } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

// 不需要认证的公开路由
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/maintenance',
  '/admin',
  '/landing',
  '/about'
]

// 管理员路由（需要额外验证）
const ADMIN_ROUTES = [
  '/admin'
]

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user, initialize } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      try {
        await initialize()
      } catch (error) {
        console.error('认证初始化失败:', error)
      } finally {
        setIsInitialized(true)
      }
    }
    
    initAuth()
  }, [initialize])

  useEffect(() => {
    if (!isInitialized) return

    // 检查是否为公开路由
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

    // 如果是登录/注册页面且已登录，重定向到主页
    if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
      router.push('/')
      return
    }

    // 如果不是公开路由且未登录，重定向到登录页
    if (!isPublicRoute && !isAuthenticated && !isLoading) {
      router.push('/landing')
      return
    }

    // 管理员路由的额外检查可以在这里添加
    // 目前管理员功能使用密码验证，所以暂时不需要额外检查
  }, [isInitialized, isAuthenticated, isLoading, pathname, router])

  // 显示加载状态
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-pink-100 rounded-full">
              <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  // 检查是否为公开路由
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  
  // 如果是公开路由或已认证，显示内容
  if (isPublicRoute || isAuthenticated) {
    return <>{children}</>
  }

  // 其他情况显示加载状态（通常不会到达这里，因为会重定向）
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-pink-100 rounded-full">
            <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
          <span className="text-gray-600">验证身份中...</span>
        </div>
      </div>
    </div>
  )
}