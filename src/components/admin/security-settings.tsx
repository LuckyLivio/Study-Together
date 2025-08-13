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

  useEffect(() => {
    // 加载安全设置
    const savedSettings = LocalStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS, null)
    if (savedSettings) {
      setSettings(savedSettings)
    }
    
    // 加载上次保存时间
    const savedTime = LocalStorage.getItem(STORAGE_KEYS.SECURITY_LAST_SAVED, null)
    if (savedTime) {
      setLastSaved(new Date(savedTime))
    }
    
    // 模拟登录尝试记录
    const mockAttempts: LoginAttempt[] = [
      {
        id: '1',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        success: true
      },
      {
        id: '2',
        ip: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        success: false,
        reason: '密码错误'
      }
    ]
    setLoginAttempts(mockAttempts)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 保存到本地存储
      LocalStorage.setItem(STORAGE_KEYS.SECURITY_SETTINGS, settings)
      const now = new Date()
      LocalStorage.setItem(STORAGE_KEYS.SECURITY_LAST_SAVED, now.toISOString())
      setLastSaved(now)
      
      toast.success('安全设置已保存')
    } catch (error) {
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
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
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
                onChange={(e) => handleInputChange('lockoutDuration', parseInt(e.target.value))}
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
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
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
                onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value))}
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
                onChange={(e) => handlePasswordPolicyChange('maxAge', parseInt(e.target.value))}
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