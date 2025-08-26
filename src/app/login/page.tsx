'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Heart } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useSiteConfig } from '@/lib/use-site-config'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, isAuthenticated } = useAuthStore()
  const { config } = useSiteConfig()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 重定向逻辑由AuthGuard处理，这里不需要额外的useEffect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('请填写所有字段')
      return
    }

    const result = await login(formData)
    
    if (result.success) {
      toast.success('登录成功！正在跳转到主页...', {
        duration: 1500
      })
      // 移除手动重定向，让useEffect处理
    } else {
      setError(result.message)
      toast.error(result.message, {
        duration: 3000
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value.trim()
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-pink-100 rounded-full">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            登录到 {config.name}
          </CardTitle>
          <CardDescription>
            欢迎回来！请登录您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">用户名/邮箱</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="请输入您的用户名或邮箱"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入您的密码"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              还没有账户？{' '}
              <Link 
                href="/register" 
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                立即注册
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}