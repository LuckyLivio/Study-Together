'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Heart, Users } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useSiteConfig } from '@/lib/use-site-config'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, login, isLoading, isAuthenticated } = useAuthStore()
  const { config } = useSiteConfig()
  
  const inviteCode = searchParams.get('invite')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: inviteCode || ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 如果已登录，重定向到主页
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 表单验证
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('请填写所有必填字段')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      inviteCode: formData.inviteCode || undefined
    })
    
    if (result.success) {
      // 注册成功后自动登录
      const loginResult = await login({
        email: formData.email,
        password: formData.password
      })
      
      if (loginResult.success) {
        if (inviteCode) {
          toast.success('注册成功！情侣绑定完成，正在跳转到主页...', {
            duration: 2000
          })
        } else {
          toast.success('注册成功！正在跳转到主页...', {
            duration: 2000
          })
        }
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        toast.success('注册成功！请手动登录')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
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
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-pink-100 rounded-full">
              {inviteCode ? (
                <Users className="h-8 w-8 text-pink-600" />
              ) : (
                <Heart className="h-8 w-8 text-pink-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {inviteCode ? '加入情侣' : '注册账户'}
          </CardTitle>
          <CardDescription>
            {inviteCode 
              ? '您收到了情侣邀请，请完成注册加入！' 
              : `欢迎加入 ${config.name}，开始您的情侣之旅`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="请输入您的姓名"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="请输入您的邮箱"
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
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">
                情侣邀请码 {!inviteCode && '(可选)'}
              </Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                placeholder="如有邀请码请输入"
                value={formData.inviteCode}
                onChange={handleChange}
                disabled={isLoading || !!inviteCode}
              />
              {inviteCode && (
                <p className="text-sm text-green-600">
                  ✓ 您将通过邀请码加入情侣
                </p>
              )}
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
                  注册中...
                </>
              ) : (
                inviteCode ? '加入情侣' : '注册账户'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账户？{' '}
              <Link 
                href="/login" 
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                立即登录
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}