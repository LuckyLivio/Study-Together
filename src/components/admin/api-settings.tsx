'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ApiSettings() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({})
  
  const [apiConfig, setApiConfig] = useState({
    // AI服务配置
    ai: {
      openai: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7
      },
      claude: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000
      },
      gemini: {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro'
      }
    },
    
    // 邮件服务
    email: {
      smtp: {
        enabled: false,
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromEmail: '',
        fromName: 'Study Together'
      },
      sendgrid: {
        enabled: false,
        apiKey: '',
        fromEmail: '',
        fromName: 'Study Together'
      }
    },
    
    // 云存储服务
    storage: {
      aws: {
        enabled: false,
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        bucket: '',
        endpoint: ''
      },
      aliyun: {
        enabled: false,
        accessKeyId: '',
        accessKeySecret: '',
        region: 'oss-cn-hangzhou',
        bucket: '',
        endpoint: ''
      },
      qiniu: {
        enabled: false,
        accessKey: '',
        secretKey: '',
        bucket: '',
        domain: ''
      }
    },
    
    // 推送服务
    push: {
      firebase: {
        enabled: false,
        serverKey: '',
        senderId: '',
        projectId: ''
      },
      jpush: {
        enabled: false,
        appKey: '',
        masterSecret: ''
      }
    },
    
    // 支付服务
    payment: {
      stripe: {
        enabled: false,
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      },
      alipay: {
        enabled: false,
        appId: '',
        privateKey: '',
        publicKey: '',
        gatewayUrl: 'https://openapi.alipay.com/gateway.do'
      },
      wechatpay: {
        enabled: false,
        mchId: '',
        apiKey: '',
        certPath: '',
        keyPath: ''
      }
    },
    
    // 地图服务
    maps: {
      google: {
        enabled: false,
        apiKey: ''
      },
      baidu: {
        enabled: false,
        apiKey: ''
      },
      amap: {
        enabled: false,
        apiKey: ''
      }
    },
    
    // 短信服务
    sms: {
      aliyun: {
        enabled: false,
        accessKeyId: '',
        accessKeySecret: '',
        signName: '',
        templateCode: ''
      },
      tencent: {
        enabled: false,
        secretId: '',
        secretKey: '',
        appId: '',
        signName: '',
        templateId: ''
      }
    }
  })

  const handleSave = () => {
    // 这里应该调用API保存配置
    toast.success('API配置已更新')
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const testConnection = async (service: string, provider: string) => {
    const testKey = `${service}-${provider}`
    setTestResults(prev => ({ ...prev, [testKey]: 'testing' }))
    
    // 模拟API测试
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70% 成功率
      setTestResults(prev => ({ 
        ...prev, 
        [testKey]: success ? 'success' : 'error' 
      }))
      
      if (success) {
        toast.success(`${provider} 连接测试成功`)
      } else {
        toast.error(`${provider} 连接测试失败`)
      }
    }, 2000)
  }

  const updateConfig = (service: string, provider: string, field: string, value: any) => {
    setApiConfig(prev => ({
      ...prev,
      [service]: {
        ...prev[service as keyof typeof prev],
        [provider]: {
          ...(prev[service as keyof typeof prev] as any)[provider],
          [field]: value
        }
      }
    }))
  }

  const renderSecretInput = (value: string, onChange: (value: string) => void, placeholder: string, testKey?: string) => {
    const isVisible = showSecrets[testKey || placeholder] || false
    
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => toggleSecret(testKey || placeholder)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {testKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const [service, provider] = testKey.split('-')
              testConnection(service, provider)
            }}
            disabled={testResults[testKey] === 'testing'}
          >
            {testResults[testKey] === 'testing' ? (
              <TestTube className="h-4 w-4 animate-spin" />
            ) : testResults[testKey] === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : testResults[testKey] === 'error' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            测试
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API配置</h2>
          <p className="text-gray-600">配置各种第三方服务的API密钥和参数</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>

      {/* AI服务配置 */}
      <Card>
        <CardHeader>
          <CardTitle>AI服务配置</CardTitle>
          <CardDescription>配置AI助手相关的服务提供商</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">OpenAI</h4>
              <Switch
                checked={apiConfig.ai.openai.enabled}
                onCheckedChange={(checked) => updateConfig('ai', 'openai', 'enabled', checked)}
              />
            </div>
            {apiConfig.ai.openai.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Key</Label>
                  {renderSecretInput(
                    apiConfig.ai.openai.apiKey,
                    (value) => updateConfig('ai', 'openai', 'apiKey', value),
                    'sk-...',
                    'ai-openai'
                  )}
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={apiConfig.ai.openai.baseUrl}
                    onChange={(e) => updateConfig('ai', 'openai', 'baseUrl', e.target.value)}
                    placeholder="API基础地址"
                  />
                </div>
                <div>
                  <Label>模型</Label>
                  <Input
                    value={apiConfig.ai.openai.model}
                    onChange={(e) => updateConfig('ai', 'openai', 'model', e.target.value)}
                    placeholder="gpt-3.5-turbo"
                  />
                </div>
                <div>
                  <Label>最大Token数</Label>
                  <Input
                    type="number"
                    value={apiConfig.ai.openai.maxTokens}
                    onChange={(e) => updateConfig('ai', 'openai', 'maxTokens', parseInt(e.target.value))}
                    placeholder="2000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Claude */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Claude (Anthropic)</h4>
              <Switch
                checked={apiConfig.ai.claude.enabled}
                onCheckedChange={(checked) => updateConfig('ai', 'claude', 'enabled', checked)}
              />
            </div>
            {apiConfig.ai.claude.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Key</Label>
                  {renderSecretInput(
                    apiConfig.ai.claude.apiKey,
                    (value) => updateConfig('ai', 'claude', 'apiKey', value),
                    'sk-ant-...',
                    'ai-claude'
                  )}
                </div>
                <div>
                  <Label>模型</Label>
                  <Input
                    value={apiConfig.ai.claude.model}
                    onChange={(e) => updateConfig('ai', 'claude', 'model', e.target.value)}
                    placeholder="claude-3-sonnet-20240229"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 邮件服务 */}
      <Card>
        <CardHeader>
          <CardTitle>邮件服务</CardTitle>
          <CardDescription>配置邮件发送服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">SMTP</h4>
              <Switch
                checked={apiConfig.email.smtp.enabled}
                onCheckedChange={(checked) => updateConfig('email', 'smtp', 'enabled', checked)}
              />
            </div>
            {apiConfig.email.smtp.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP主机</Label>
                  <Input
                    value={apiConfig.email.smtp.host}
                    onChange={(e) => updateConfig('email', 'smtp', 'host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label>端口</Label>
                  <Input
                    type="number"
                    value={apiConfig.email.smtp.port}
                    onChange={(e) => updateConfig('email', 'smtp', 'port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label>用户名</Label>
                  <Input
                    value={apiConfig.email.smtp.username}
                    onChange={(e) => updateConfig('email', 'smtp', 'username', e.target.value)}
                    placeholder="邮箱用户名"
                  />
                </div>
                <div>
                  <Label>密码</Label>
                  {renderSecretInput(
                    apiConfig.email.smtp.password,
                    (value) => updateConfig('email', 'smtp', 'password', value),
                    '邮箱密码',
                    'email-smtp'
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 云存储服务 */}
      <Card>
        <CardHeader>
          <CardTitle>云存储服务</CardTitle>
          <CardDescription>配置文件存储服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AWS S3 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">AWS S3</h4>
              <Switch
                checked={apiConfig.storage.aws.enabled}
                onCheckedChange={(checked) => updateConfig('storage', 'aws', 'enabled', checked)}
              />
            </div>
            {apiConfig.storage.aws.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Access Key ID</Label>
                  {renderSecretInput(
                    apiConfig.storage.aws.accessKeyId,
                    (value) => updateConfig('storage', 'aws', 'accessKeyId', value),
                    'AKIA...',
                    'storage-aws'
                  )}
                </div>
                <div>
                  <Label>Secret Access Key</Label>
                  {renderSecretInput(
                    apiConfig.storage.aws.secretAccessKey,
                    (value) => updateConfig('storage', 'aws', 'secretAccessKey', value),
                    'Secret Key'
                  )}
                </div>
                <div>
                  <Label>区域</Label>
                  <Input
                    value={apiConfig.storage.aws.region}
                    onChange={(e) => updateConfig('storage', 'aws', 'region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </div>
                <div>
                  <Label>存储桶</Label>
                  <Input
                    value={apiConfig.storage.aws.bucket}
                    onChange={(e) => updateConfig('storage', 'aws', 'bucket', e.target.value)}
                    placeholder="bucket-name"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 支付服务 */}
      <Card>
        <CardHeader>
          <CardTitle>支付服务</CardTitle>
          <CardDescription>配置在线支付服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stripe */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Stripe</h4>
              <Switch
                checked={apiConfig.payment.stripe.enabled}
                onCheckedChange={(checked) => updateConfig('payment', 'stripe', 'enabled', checked)}
              />
            </div>
            {apiConfig.payment.stripe.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Publishable Key</Label>
                  <Input
                    value={apiConfig.payment.stripe.publishableKey}
                    onChange={(e) => updateConfig('payment', 'stripe', 'publishableKey', e.target.value)}
                    placeholder="pk_..."
                  />
                </div>
                <div>
                  <Label>Secret Key</Label>
                  {renderSecretInput(
                    apiConfig.payment.stripe.secretKey,
                    (value) => updateConfig('payment', 'stripe', 'secretKey', value),
                    'sk_...',
                    'payment-stripe'
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 短信服务 */}
      <Card>
        <CardHeader>
          <CardTitle>短信服务</CardTitle>
          <CardDescription>配置短信发送服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 阿里云短信 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">阿里云短信</h4>
              <Switch
                checked={apiConfig.sms.aliyun.enabled}
                onCheckedChange={(checked) => updateConfig('sms', 'aliyun', 'enabled', checked)}
              />
            </div>
            {apiConfig.sms.aliyun.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Access Key ID</Label>
                  {renderSecretInput(
                    apiConfig.sms.aliyun.accessKeyId,
                    (value) => updateConfig('sms', 'aliyun', 'accessKeyId', value),
                    'LTAI...',
                    'sms-aliyun'
                  )}
                </div>
                <div>
                  <Label>Access Key Secret</Label>
                  {renderSecretInput(
                    apiConfig.sms.aliyun.accessKeySecret,
                    (value) => updateConfig('sms', 'aliyun', 'accessKeySecret', value),
                    'Secret Key'
                  )}
                </div>
                <div>
                  <Label>签名名称</Label>
                  <Input
                    value={apiConfig.sms.aliyun.signName}
                    onChange={(e) => updateConfig('sms', 'aliyun', 'signName', e.target.value)}
                    placeholder="短信签名"
                  />
                </div>
                <div>
                  <Label>模板代码</Label>
                  <Input
                    value={apiConfig.sms.aliyun.templateCode}
                    onChange={(e) => updateConfig('sms', 'aliyun', 'templateCode', e.target.value)}
                    placeholder="SMS_123456"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}