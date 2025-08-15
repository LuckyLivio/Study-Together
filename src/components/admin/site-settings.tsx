'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Globe, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { LocalStorage, STORAGE_KEYS } from '@/lib/storage'

export function SiteSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Study Together',
    siteDescription: '情侣共同学习平台',
    siteUrl: 'https://study-together.com',
    logoUrl: '',
    faviconUrl: '',
    contactEmail: 'admin@study-together.com',
    contactPhone: '',
    address: '',
    socialLinks: {
      github: '',
      twitter: '',
      instagram: '',
      wechat: ''
    },
    seo: {
      keywords: '学习,情侣,共同进步,任务管理',
      author: 'Study Together Team',
      ogImage: ''
    },
    maintenance: {
      enabled: false,
      message: '网站正在维护中，请稍后访问'
    },
    analytics: {
      googleAnalyticsId: '',
      baiduAnalyticsId: ''
    }
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 组件加载时从API读取设置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // 加载维护模式设置
      const maintenanceResponse = await fetch('/api/admin/maintenance')
      let maintenanceSettings = {
        enabled: false,
        message: '网站正在维护中，请稍后访问'
      }
      
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json()
        maintenanceSettings = {
          enabled: maintenanceData.enabled,
          message: maintenanceData.message
        }
      }
      
      // 加载网站设置
      const siteResponse = await fetch('/api/admin/site-settings')
      if (siteResponse.ok) {
        const siteData = await siteResponse.json()
        setSettings(prev => ({
          ...prev,
          ...siteData,
          maintenance: maintenanceSettings // 保持从维护模式API获取的设置
        }))
      } else {
        // 如果API失败，设置维护模式
        setSettings(prev => ({
          ...prev,
          maintenance: maintenanceSettings
        }))
      }
       
    } catch (error) {
      console.error('加载设置失败:', error)
      toast('加载设置失败', {
        description: '无法加载网站设置，请刷新页面重试',
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
      
      // 保存维护模式到API
      const maintenanceResponse = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          enabled: settings.maintenance.enabled,
          message: settings.maintenance.message
        })
      })
      
      if (!maintenanceResponse.ok) {
        const errorData = await maintenanceResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `保存维护模式设置失败 (${maintenanceResponse.status})`)
      }
      
      // 保存网站设置到API
      const siteResponse = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          siteUrl: settings.siteUrl,
          logoUrl: settings.logoUrl,
          faviconUrl: settings.faviconUrl,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          address: settings.address,
          socialLinks: settings.socialLinks,
          seo: settings.seo,
          analytics: settings.analytics
        })
      })
      
      if (!siteResponse.ok) {
        const errorData = await siteResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `保存网站设置失败 (${siteResponse.status})`)
      }
      
      setLastSaved(new Date())
      
      toast('设置已保存', {
        description: '网站设置已成功更新',
      })
    } catch (error) {
      console.error('保存设置失败:', error)
      toast('保存失败', {
        description: error instanceof Error ? error.message : '保存设置时发生错误，请重试',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (section: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, any>),
        [field]: value
      }
    }))
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">网站设置</h2>
          <p className="text-gray-600">配置网站的基本信息和全局设置</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              上次保存: {lastSaved.toLocaleString()}
            </div>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>网站的基本信息配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">网站名称</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="输入网站名称"
              />
            </div>
            <div>
              <Label htmlFor="siteUrl">网站地址</Label>
              <Input
                id="siteUrl"
                value={settings.siteUrl}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="siteDescription">网站描述</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleInputChange('siteDescription', e.target.value)}
              placeholder="输入网站描述"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logoUrl"
                  value={settings.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  placeholder="Logo图片地址"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <div className="flex gap-2">
                <Input
                  id="faviconUrl"
                  value={settings.faviconUrl}
                  onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                  placeholder="Favicon图片地址"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 联系信息 */}
      <Card>
        <CardHeader>
          <CardTitle>联系信息</CardTitle>
          <CardDescription>网站的联系方式配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">联系邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contactEmail"
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contactPhone">联系电话</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="联系电话"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="address">联系地址</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="联系地址"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 社交媒体 */}
      <Card>
        <CardHeader>
          <CardTitle>社交媒体</CardTitle>
          <CardDescription>配置社交媒体链接</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={settings.socialLinks.github}
                onChange={(e) => handleNestedChange('socialLinks', 'github', e.target.value)}
                placeholder="GitHub链接"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={settings.socialLinks.twitter}
                onChange={(e) => handleNestedChange('socialLinks', 'twitter', e.target.value)}
                placeholder="Twitter链接"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.socialLinks.instagram}
                onChange={(e) => handleNestedChange('socialLinks', 'instagram', e.target.value)}
                placeholder="Instagram链接"
              />
            </div>
            <div>
              <Label htmlFor="wechat">微信</Label>
              <Input
                id="wechat"
                value={settings.socialLinks.wechat}
                onChange={(e) => handleNestedChange('socialLinks', 'wechat', e.target.value)}
                placeholder="微信号"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO设置 */}
      <Card>
        <CardHeader>
          <CardTitle>SEO设置</CardTitle>
          <CardDescription>搜索引擎优化配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="keywords">关键词</Label>
            <Input
              id="keywords"
              value={settings.seo.keywords}
              onChange={(e) => handleNestedChange('seo', 'keywords', e.target.value)}
              placeholder="用逗号分隔关键词"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author">作者</Label>
              <Input
                id="author"
                value={settings.seo.author}
                onChange={(e) => handleNestedChange('seo', 'author', e.target.value)}
                placeholder="网站作者"
              />
            </div>
            <div>
              <Label htmlFor="ogImage">分享图片</Label>
              <Input
                id="ogImage"
                value={settings.seo.ogImage}
                onChange={(e) => handleNestedChange('seo', 'ogImage', e.target.value)}
                placeholder="社交分享图片URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 维护模式 */}
      <Card>
        <CardHeader>
          <CardTitle>维护模式</CardTitle>
          <CardDescription>网站维护模式配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance"
              checked={settings.maintenance.enabled}
              onCheckedChange={(checked) => handleNestedChange('maintenance', 'enabled', checked)}
            />
            <Label htmlFor="maintenance">启用维护模式</Label>
          </div>
          <div>
            <Label htmlFor="maintenanceMessage">维护提示信息</Label>
            <Textarea
              id="maintenanceMessage"
              value={settings.maintenance.message}
              onChange={(e) => handleNestedChange('maintenance', 'message', e.target.value)}
              placeholder="维护模式下显示的提示信息"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 统计分析 */}
      <Card>
        <CardHeader>
          <CardTitle>统计分析</CardTitle>
          <CardDescription>网站统计分析配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
              <Input
                id="googleAnalytics"
                value={settings.analytics.googleAnalyticsId}
                onChange={(e) => handleNestedChange('analytics', 'googleAnalyticsId', e.target.value)}
                placeholder="GA-XXXXXXXXX"
              />
            </div>
            <div>
              <Label htmlFor="baiduAnalytics">百度统计ID</Label>
              <Input
                id="baiduAnalytics"
                value={settings.analytics.baiduAnalyticsId}
                onChange={(e) => handleNestedChange('analytics', 'baiduAnalyticsId', e.target.value)}
                placeholder="百度统计ID"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}