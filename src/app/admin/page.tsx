'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminAuth } from '@/components/admin/admin-auth'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('site')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const router = useRouter()

  const handleAuthenticated = (user: any) => {
    setIsAuthenticated(true)
    setAdminUser(user)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setAdminUser(null)
    router.push('/')
  }

  // 如果未认证，显示管理员登录界面
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />
  }

  // 认证后显示管理面板
  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
  )
}