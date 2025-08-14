'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { siteConfig } from '@/lib/config'
import { useSiteConfig } from '@/lib/use-site-config'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Target, 
  MessageCircle, 
  Settings, 
  User,
  Heart,
  LogOut,
  Users
} from 'lucide-react'

const navigation = [
  { name: '仪表盘', href: '/', icon: Home },
  { name: '学习任务', href: '/tasks', icon: Target },
  { name: '课程表', href: '/schedule', icon: Calendar },
  { name: '资料库', href: '/files', icon: BookOpen },
  { name: '留言墙', href: '/messages', icon: MessageCircle },
  { name: 'AI助手', href: '/ai', icon: MessageCircle },
]

export function Navbar() {
  const router = useRouter()
  const { config, isLoading } = useSiteConfig()
  const { user, couple, isAuthenticated, logout } = useAuthStore()
  
  const handleLogout = () => {
    logout()
    toast.success('已成功退出登录')
    router.push('/login')
  }
  
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-500" fill="currentColor" />
            <span className="font-bold text-xl">{isLoading ? siteConfig.name : config.name}</span>
          </Link>

          {/* 导航菜单 - 只有登录用户才显示 */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* 用户菜单 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* 情侣状态显示 */}
                {couple && couple.isComplete && (
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-pink-500" />
                    <span>{couple.person1Name} & {couple.person2Name}</span>
                  </div>
                )}
                
                {/* 用户菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-pink-100 text-pink-600">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        个人资料
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          管理设置
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}