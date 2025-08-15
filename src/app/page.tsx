'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 已登录用户跳转到仪表盘
        router.push('/couple')
      } else {
        // 未登录用户跳转到着陆页
        router.push('/landing')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // 显示加载状态
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}
