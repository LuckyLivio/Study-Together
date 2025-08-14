'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Eye, EyeOff, TestTube, CheckCircle, XCircle, Copy, RefreshCw, Database, Key, Bot, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface EnvVariable {
  key: string
  value: string
  description: string
  required: boolean
  sensitive: boolean
  category: 'database' | 'auth' | 'ai' | 'app' | 'external'
  example?: string
}

const ENV_VARIABLES: EnvVariable[] = [
  // Database
  {
    key: 'DATABASE_URL',
    value: '',
    description: '数据库连接字符串',
    required: true,
    sensitive: true,
    category: 'database',
    example: 'postgresql://user:password@localhost:5432/dbname'
  },
  
  // Authentication
  {
    key: 'JWT_SECRET',
    value: '',
    description: 'JWT令牌加密密钥',
    required: true,
    sensitive: true,
    category: 'auth',
    example: 'your-super-secret-jwt-key-here'
  },
  
  // AI Configuration
  {
    key: 'DEEPSEEK_API_KEY',
    value: '',
    description: 'DeepSeek AI API密钥',
    required: false,
    sensitive: true,
    category: 'ai',
    example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  {
    key: 'DEEPSEEK_API_URL',
    value: 'https://api.deepseek.com/chat/completions',
    description: 'DeepSeek API端点地址',
    required: false,
    sensitive: false,
    category: 'ai'
  },
  
  // Application
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'http://localhost:3000',
    description: '应用程序公共URL',
    required: true,
    sensitive: false,
    category: 'app'
  },
  {
    key: 'NODE_ENV',
    value: 'development',
    description: '运行环境',
    required: true,
    sensitive: false,
    category: 'app'
  }
]

const CATEGORY_CONFIG = {
  database: { name: '数据库', icon: Database, color: 'bg-blue-500' },
  auth: { name: '认证', icon: Key, color: 'bg-green-500' },
  ai: { name: 'AI服务', icon: Bot, color: 'bg-purple-500' },
  app: { name: '应用配置', icon: Globe, color: 'bg-orange-500' },
  external: { name: '外部服务', icon: Globe, color: 'bg-gray-500' }
}

export function EnvSettings() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>(ENV_VARIABLES)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 加载当前环境变量
  useEffect(() => {
    loadCurrentEnvVars()
  }, [])

  const loadCurrentEnvVars = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        toast.error('未找到认证令牌，请重新登录')
        return
      }
      
      const response = await fetch('/api/admin/env', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const currentEnv = await response.json()
        setEnvVars(prev => prev.map(envVar => ({
          ...envVar,
          value: currentEnv[envVar.key] || envVar.value
        })))
        toast.success('配置已刷新')
        setHasChanges(false)
      } else if (response.status === 401) {
        toast.error('认证失败，请重新登录')
      } else {
        toast.error('加载配置失败')
      }
    } catch (error) {
      console.error('Failed to load environment variables:', error)
      toast.error('网络错误，请检查连接')
    } finally {
      setIsLoading(false)
    }
  }

  const updateEnvVar = (key: string, value: string) => {
    setEnvVars(prev => prev.map(envVar => 
      envVar.key === key ? { ...envVar, value } : envVar
    ))
    setHasChanges(true)
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const testConnection = async (key: string) => {
    setTestResults(prev => ({ ...prev, [key]: 'testing' }))
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/env/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value: envVars.find(v => v.key === key)?.value })
      })
      
      const result = await response.json()
      setTestResults(prev => ({ 
        ...prev, 
        [key]: result.success ? 'success' : 'error' 
      }))
      
      if (result.success) {
        toast.success(`${key} 连接测试成功`)
      } else {
        toast.error(`${key} 连接测试失败: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [key]: 'error' }))
      toast.error(`${key} 连接测试失败`)
    }
  }

  const saveEnvVars = async () => {
    setIsLoading(true)
    try {
      const envData = envVars.reduce((acc, envVar) => {
        if (envVar.value) {
          acc[envVar.key] = envVar.value
        }
        return acc
      }, {} as Record<string, string>)

      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/env', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(envData)
      })

      if (response.ok) {
        toast.success('环境变量保存成功')
        setHasChanges(false)
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSecretKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const renderEnvInput = (envVar: EnvVariable) => {
    const isSecret = envVar.sensitive && !showSecrets[envVar.key]
    const testResult = testResults[envVar.key]

    return (
      <div key={envVar.key} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="font-medium">{envVar.key}</Label>
            {envVar.required && <Badge variant="destructive" className="text-xs">必需</Badge>}
            {envVar.sensitive && <Badge variant="secondary" className="text-xs">敏感</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {envVar.sensitive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility(envVar.key)}
              >
                {showSecrets[envVar.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            {envVar.key === 'JWT_SECRET' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateEnvVar(envVar.key, generateSecretKey())}
                title="生成随机密钥"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {envVar.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(envVar.value)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {(envVar.category === 'database' || envVar.category === 'ai') && envVar.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testConnection(envVar.key)}
                disabled={testResult === 'testing'}
              >
                {testResult === 'testing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : testResult === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600">{envVar.description}</p>
        
        <Input
          type={isSecret ? 'password' : 'text'}
          value={envVar.value}
          onChange={(e) => updateEnvVar(envVar.key, e.target.value)}
          placeholder={envVar.example || `输入 ${envVar.key}`}
          className={envVar.required && !envVar.value ? 'border-red-300' : ''}
        />
        
        {envVar.example && (
          <p className="text-xs text-gray-500">示例: {envVar.example}</p>
        )}
      </div>
    )
  }

  const groupedEnvVars = envVars.reduce((acc, envVar) => {
    if (!acc[envVar.category]) {
      acc[envVar.category] = []
    }
    acc[envVar.category].push(envVar)
    return acc
  }, {} as Record<string, EnvVariable[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">环境变量配置</h2>
          <p className="text-gray-600">管理应用程序的环境变量和配置</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadCurrentEnvVars}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button 
            onClick={saveEnvVars} 
            disabled={!hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription>
            您有未保存的更改。请记得保存配置以使更改生效。
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">全部</TabsTrigger>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              <config.icon className="h-4 w-4 mr-1" />
              {config.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedEnvVars).map(([category, vars]) => {
            const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <config.icon className="h-5 w-5" />
                    {config.name}
                  </CardTitle>
                  <CardDescription>
                    {category === 'database' && '数据库连接和存储配置'}
                    {category === 'auth' && '身份验证和安全配置'}
                    {category === 'ai' && 'AI服务和API配置'}
                    {category === 'app' && '应用程序基础配置'}
                    {category === 'external' && '第三方服务配置'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vars.map(renderEnvInput)}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="h-5 w-5" />
                  {config.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedEnvVars[category]?.map(renderEnvInput) || (
                  <p className="text-gray-500">此类别暂无配置项</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}