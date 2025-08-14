'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

import { 
  Shield, 
  Key, 
  Smartphone, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save
} from 'lucide-react'
import { toast } from 'sonner'
import { LocalStorage, STORAGE_KEYS } from '@/lib/storage'

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

interface LoginAttempt {
  id: string
  ip: string
  userAgent: string
  timestamp: string
  success: boolean
  reason?: string
}

export function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>({
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 60,
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
  
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [newIP, setNewIP] = useState('')

  // 加载安全设置和登录记录
  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        const response = await fetch('/api/admin/security', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
          setLoginAttempts(data.loginAttempts)
          setLastSaved(new Date())
        } else {
          console.error('加载安全设置失败')
          toast.error('加载安全设置失败')
        }
      } catch (error) {
        console.error('加载安全设置错误:', error)
        toast.error('加载安全设置失败')
      }
    }
    
    loadSecurityData()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ settings }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // 更新本地状态以反映服务器保存的数据
        if (data.settings) {
          setSettings(data.settings)
        }
        const now = new Date()
        setLastSaved(now)
        toast.success('安全设置已保存')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '保存失败，请重试')
      }
    } catch (error) {
      console.error('保存安全设置错误:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordPolicyChange = (field: keyof SecuritySettings['passwordPolicy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [field]: value
      }
    }))
  }

  const addAllowedIP = () => {
    if (newIP && !settings.allowedIPs.includes(newIP)) {
      setSettings(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP]
      }))
      setNewIP('')
    }
  }

  const removeAllowedIP = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter(allowedIP => allowedIP !== ip)
    }))
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">安全管理</h2>
          <p className="text-muted-foreground mt-1">管理系统安全设置和访问控制</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>上次保存: {lastSaved.toLocaleString()}</span>
            </div>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* 登录安全 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            登录安全
          </CardTitle>
          <CardDescription>
            配置登录相关的安全策略
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">最大登录尝试次数</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value) || 1)}
                min="1"
                max="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">锁定时长 (分钟)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => handleInputChange('lockoutDuration', parseInt(e.target.value) || 1)}
                min="1"
                max="1440"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">会话超时 (分钟)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value) || 5)}
                min="5"
                max="1440"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="twoFactor"
                checked={settings.requireTwoFactor}
                onCheckedChange={(checked) => handleInputChange('requireTwoFactor', checked)}
              />
              <Label htmlFor="twoFactor">启用双因素认证</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 密码策略 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            密码策略
          </CardTitle>
          <CardDescription>
            设置密码复杂度要求
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minLength">最小长度</Label>
              <Input
                id="minLength"
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value) || 6)}
                min="6"
                max="32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAge">密码有效期 (天)</Label>
              <Input
                id="maxAge"
                type="number"
                value={settings.passwordPolicy.maxAge}
                onChange={(e) => handlePasswordPolicyChange('maxAge', parseInt(e.target.value) || 30)}
                min="30"
                max="365"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requireUppercase"
                checked={settings.passwordPolicy.requireUppercase}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireUppercase', checked)}
              />
              <Label htmlFor="requireUppercase">大写字母</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireLowercase"
                checked={settings.passwordPolicy.requireLowercase}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireLowercase', checked)}
              />
              <Label htmlFor="requireLowercase">小写字母</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireNumbers"
                checked={settings.passwordPolicy.requireNumbers}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireNumbers', checked)}
              />
              <Label htmlFor="requireNumbers">数字</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireSpecialChars"
                checked={settings.passwordPolicy.requireSpecialChars}
                onCheckedChange={(checked) => handlePasswordPolicyChange('requireSpecialChars', checked)}
              />
              <Label htmlFor="requireSpecialChars">特殊字符</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IP白名单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IP访问控制
          </CardTitle>
          <CardDescription>
            管理允许访问的IP地址
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入IP地址 (例: 192.168.1.100)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Button onClick={addAllowedIP} disabled={!newIP}>
              添加
            </Button>
          </div>
          
          <div className="space-y-2">
            {settings.allowedIPs.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无IP白名单，所有IP都可以访问</p>
            ) : (
              settings.allowedIPs.map((ip, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">{ip}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAllowedIP(ip)}
                  >
                    移除
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 登录记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近登录记录
          </CardTitle>
          <CardDescription>
            查看最近的登录尝试记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loginAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{attempt.ip}</span>
                    <Badge variant={attempt.success ? 'default' : 'destructive'}>
                      {attempt.success ? '成功' : '失败'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </p>
                  {attempt.reason && (
                    <p className="text-xs text-red-600">{attempt.reason}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground max-w-xs truncate">
                  {attempt.userAgent}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}