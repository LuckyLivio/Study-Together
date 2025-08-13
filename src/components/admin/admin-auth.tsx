'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  LogOut,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminAuthProps {
  onAuthenticated: (user: any) => void
}

interface LoginAttempt {
  id: string
  ip: string
  userAgent: string
  timestamp: string
  success: boolean
  reason?: string
}

interface SecuritySettings {
  maxLoginAttempts: number
  lockoutDuration: number // 分钟
  sessionTimeout: number // 分钟
  requireTwoFactor: boolean
  allowedIPs: string[]
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number // 天
  }
}

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    twoFactorCode: '',
    rememberMe: false
  })
  
  // 安全设置
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 120,
    requireTwoFactor: false,
    allowedIPs: [],
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90
    }
  })
  
  // 登录历史
  const [loginHistory, setLoginHistory] = useState<LoginAttempt[]>([
    {
      id: '1',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0',
      timestamp: '2024-01-15 10:30:00',
      success: true
    },
    {
      id: '2',
      ip: '192.168.1.101',
      userAgent: 'Firefox 121.0.0.0',
      timestamp: '2024-01-15 09:15:00',
      success: false,
      reason: '密码错误'
    },
    {
      id: '3',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0',
      timestamp: '2024-01-14 16:45:00',
      success: true
    }
  ])
  
  // 当前会话信息
  const [sessionInfo, setSessionInfo] = useState({
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    ip: '192.168.1.100',
    userAgent: 'Chrome 120.0.0.0',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2小时后过期
  })

  // 检查认证状态
  useEffect(() => {
    const checkAuth = () => {
      // 这里应该检查实际的认证状态
      const token = localStorage.getItem('admin_token')
      if (token) {
        // 验证token有效性
        setIsAuthenticated(true)
        setShowLogin(false)
      }
    }
    
    checkAuth()
  }, [])

  // 处理登录
  const handleLogin = async () => {
    setLoading(true)
    
    try {
      // 模拟登录验证
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        const user = {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['*']
        }
        
        // 保存认证信息
        localStorage.setItem('admin_token', 'mock_token_' + Date.now())
        localStorage.setItem('admin_user', JSON.stringify(user))
        
        setIsAuthenticated(true)
        setShowLogin(false)
        onAuthenticated(user)
        
        // 记录登录历史
        const newAttempt: LoginAttempt = {
          id: Date.now().toString(),
          ip: '192.168.1.100',
          userAgent: navigator.userAgent,
          timestamp: new Date().toLocaleString(),
          success: true
        }
        setLoginHistory(prev => [newAttempt, ...prev])
        
        toast.success('登录成功')
      } else {
        // 记录失败的登录尝试
        const newAttempt: LoginAttempt = {
          id: Date.now().toString(),
          ip: '192.168.1.100',
          userAgent: navigator.userAgent,
          timestamp: new Date().toLocaleString(),
          success: false,
          reason: '用户名或密码错误'
        }
        setLoginHistory(prev => [newAttempt, ...prev])
        
        toast.error('用户名或密码错误')
      }
    } catch (error) {
      toast.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setIsAuthenticated(false)
    setShowLogin(true)
    setLoginForm({ username: '', password: '', twoFactorCode: '', rememberMe: false })
    toast.success('已安全登出')
  }

  // 更新安全设置
  const updateSecuritySettings = (key: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 更新密码策略
  const updatePasswordPolicy = (key: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [key]: value
      }
    }))
  }

  // 保存安全设置
  const saveSecuritySettings = () => {
    // 这里应该调用API保存设置
    toast.success('安全设置已更新')
  }

  // 如果未认证，显示登录界面
  if (!isAuthenticated || showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>管理员登录</CardTitle>
            <CardDescription>请输入管理员凭据以访问管理面板</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="输入管理员用户名"
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="输入管理员密码"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {securitySettings.requireTwoFactor && (
              <div>
                <Label htmlFor="twoFactor">双因素认证码</Label>
                <Input
                  id="twoFactor"
                  type="text"
                  value={loginForm.twoFactorCode}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                  placeholder="输入6位验证码"
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="remember"
                checked={loginForm.rememberMe}
                onCheckedChange={(checked) => setLoginForm(prev => ({ ...prev, rememberMe: checked }))}
                disabled={loading}
              />
              <Label htmlFor="remember">记住我</Label>
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={loading || !loginForm.username || !loginForm.password}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {loading ? '登录中...' : '登录'}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>默认账户: admin / admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 认证后显示安全管理界面
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">安全管理</h2>
          <p className="text-gray-600">管理管理员认证和安全设置</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveSecuritySettings}>
            <Settings className="h-4 w-4 mr-2" />
            保存设置
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>
      </div>

      {/* 当前会话信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            当前会话
          </CardTitle>
          <CardDescription>当前管理员会话的详细信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">会话开始时间</Label>
              <p className="text-sm text-gray-600">{new Date(sessionInfo.startTime).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">最后活动时间</Label>
              <p className="text-sm text-gray-600">{new Date(sessionInfo.lastActivity).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">IP地址</Label>
              <p className="text-sm text-gray-600">{sessionInfo.ip}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">会话过期时间</Label>
              <p className="text-sm text-gray-600">{new Date(sessionInfo.expiresAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 安全设置 */}
      <Card>
        <CardHeader>
          <CardTitle>安全设置</CardTitle>
          <CardDescription>配置管理员认证的安全策略</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 登录安全 */}
          <div>
            <h4 className="font-medium mb-4">登录安全</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>最大登录尝试次数</Label>
                <Input
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => updateSecuritySettings('maxLoginAttempts', parseInt(e.target.value))}
                  min={1}
                  max={10}
                />
              </div>
              <div>
                <Label>锁定持续时间（分钟）</Label>
                <Input
                  type="number"
                  value={securitySettings.lockoutDuration}
                  onChange={(e) => updateSecuritySettings('lockoutDuration', parseInt(e.target.value))}
                  min={5}
                  max={1440}
                />
              </div>
              <div>
                <Label>会话超时时间（分钟）</Label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => updateSecuritySettings('sessionTimeout', parseInt(e.target.value))}
                  min={30}
                  max={480}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={securitySettings.requireTwoFactor}
                  onCheckedChange={(checked) => updateSecuritySettings('requireTwoFactor', checked)}
                />
                <Label>启用双因素认证</Label>
              </div>
            </div>
          </div>

          {/* 密码策略 */}
          <div>
            <h4 className="font-medium mb-4">密码策略</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>最小长度</Label>
                <Input
                  type="number"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
                  min={6}
                  max={32}
                />
              </div>
              <div>
                <Label>密码有效期（天）</Label>
                <Input
                  type="number"
                  value={securitySettings.passwordPolicy.maxAge}
                  onChange={(e) => updatePasswordPolicy('maxAge', parseInt(e.target.value))}
                  min={30}
                  max={365}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={securitySettings.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireUppercase', checked)}
                />
                <Label>要求大写字母</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={securitySettings.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireLowercase', checked)}
                />
                <Label>要求小写字母</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={securitySettings.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireNumbers', checked)}
                />
                <Label>要求数字</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={securitySettings.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => updatePasswordPolicy('requireSpecialChars', checked)}
                />
                <Label>要求特殊字符</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 登录历史 */}
      <Card>
        <CardHeader>
          <CardTitle>登录历史</CardTitle>
          <CardDescription>最近的管理员登录记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loginHistory.slice(0, 10).map(attempt => (
              <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {attempt.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{attempt.ip}</span>
                      <Badge className={attempt.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {attempt.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {attempt.userAgent} • {attempt.timestamp}
                    </div>
                    {!attempt.success && attempt.reason && (
                      <div className="text-sm text-red-600">
                        原因: {attempt.reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}