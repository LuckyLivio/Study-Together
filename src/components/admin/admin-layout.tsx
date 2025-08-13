'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  Palette, 
  Plug, 
  ToggleLeft, 
  Users, 
  Info,
  Shield,
  Home,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SiteSettings } from './site-settings'
import { UserSettings } from './user-settings'
import { ApiSettings } from './api-settings'
import { FeatureSettings } from './feature-settings'
import { SecuritySettings } from './security-settings'

interface AdminLayoutProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout?: () => void
}

const menuItems = [
  { id: 'site', label: '网站设置', icon: Settings },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'api', label: 'API设置', icon: Plug },
  { id: 'features', label: '功能管理', icon: ToggleLeft },
  { id: 'security', label: '安全管理', icon: Shield },
]

const renderContent = (activeTab: string) => {
  switch (activeTab) {
    case 'site':
      return <SiteSettings />
    case 'users':
      return <UserSettings />
    case 'api':
      return <ApiSettings />
    case 'features':
      return <FeatureSettings />
    case 'security':
      return <SecuritySettings />
    default:
      return <SiteSettings />
  }
}

export function AdminLayout({ activeTab, onTabChange, onLogout }: AdminLayoutProps) {
  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated')
    toast.success('管理员已安全退出')
    if (onLogout) {
      onLogout()
    } else {
      window.location.reload()
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">管理员面板</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <Card className="p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1">
            {renderContent(activeTab)}
          </div>
        </div>
      </div>
    </div>
  )
}