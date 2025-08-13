'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Palette, Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'

export function ThemeSettings() {
  const [themeConfig, setThemeConfig] = useState({
    // 主题模式
    defaultTheme: 'light', // light, dark, system
    allowUserToggle: true,
    
    // 主色调配置
    primaryColors: {
      light: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        border: '#e2e8f0'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#94a3b8',
        accent: '#fbbf24',
        background: '#0f172a',
        foreground: '#f8fafc',
        muted: '#1e293b',
        border: '#334155'
      }
    },
    
    // 情侣主题配置
    coupleTheme: {
      enabled: true,
      partner1: {
        name: '小明',
        color: '#ec4899',
        avatar: ''
      },
      partner2: {
        name: '小红',
        color: '#8b5cf6',
        avatar: ''
      }
    },
    
    // 字体配置
    typography: {
      fontFamily: 'Inter',
      fontSize: {
        base: '16px',
        scale: '1.125'
      },
      lineHeight: '1.6'
    },
    
    // 布局配置
    layout: {
      borderRadius: '0.5rem',
      spacing: '1rem',
      containerMaxWidth: '1200px'
    },
    
    // 动画配置
    animations: {
      enabled: true,
      duration: '200ms',
      easing: 'ease-in-out'
    }
  })

  const handleSave = () => {
    // 这里应该调用API保存主题配置
    toast.success('主题配置已更新')
  }

  const handleColorChange = (theme: 'light' | 'dark', colorKey: string, value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      primaryColors: {
        ...prev.primaryColors,
        [theme]: {
          ...prev.primaryColors[theme],
          [colorKey]: value
        }
      }
    }))
  }

  const handleCoupleChange = (partner: 'partner1' | 'partner2', field: string, value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      coupleTheme: {
        ...prev.coupleTheme,
        [partner]: {
          ...prev.coupleTheme[partner],
          [field]: value
        }
      }
    }))
  }

  const presetColors = [
    { name: '蓝色', value: '#3b82f6' },
    { name: '紫色', value: '#8b5cf6' },
    { name: '粉色', value: '#ec4899' },
    { name: '绿色', value: '#10b981' },
    { name: '橙色', value: '#f59e0b' },
    { name: '红色', value: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">主题配置</h2>
          <p className="text-gray-600">自定义网站的外观和主题设置</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>

      {/* 主题模式 */}
      <Card>
        <CardHeader>
          <CardTitle>主题模式</CardTitle>
          <CardDescription>配置网站的主题模式和用户选择权限</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>默认主题</Label>
            <div className="flex gap-4 mt-2">
              {[
                { value: 'light', label: '浅色', icon: Sun },
                { value: 'dark', label: '深色', icon: Moon },
                { value: 'system', label: '跟随系统', icon: Monitor }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setThemeConfig(prev => ({ ...prev, defaultTheme: value }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    themeConfig.defaultTheme === value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="allowUserToggle"
              checked={themeConfig.allowUserToggle}
              onCheckedChange={(checked) => setThemeConfig(prev => ({ ...prev, allowUserToggle: checked }))}
            />
            <Label htmlFor="allowUserToggle">允许用户切换主题</Label>
          </div>
        </CardContent>
      </Card>

      {/* 颜色配置 */}
      <Card>
        <CardHeader>
          <CardTitle>颜色配置</CardTitle>
          <CardDescription>自定义浅色和深色主题的颜色方案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 浅色主题 */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Sun className="h-4 w-4" />
              浅色主题
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(themeConfig.primaryColors.light).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`light-${key}`} className="capitalize">
                    {key === 'primary' ? '主色' : 
                     key === 'secondary' ? '次要色' :
                     key === 'accent' ? '强调色' :
                     key === 'background' ? '背景色' :
                     key === 'foreground' ? '前景色' :
                     key === 'muted' ? '静音色' : '边框色'}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id={`light-${key}`}
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange('light', key, e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleColorChange('light', key, e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 深色主题 */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              深色主题
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(themeConfig.primaryColors.dark).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`dark-${key}`} className="capitalize">
                    {key === 'primary' ? '主色' : 
                     key === 'secondary' ? '次要色' :
                     key === 'accent' ? '强调色' :
                     key === 'background' ? '背景色' :
                     key === 'foreground' ? '前景色' :
                     key === 'muted' ? '静音色' : '边框色'}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id={`dark-${key}`}
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange('dark', key, e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleColorChange('dark', key, e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 预设颜色 */}
          <div>
            <h4 className="font-medium mb-3">预设颜色</h4>
            <div className="flex gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    handleColorChange('light', 'primary', color.value)
                    handleColorChange('dark', 'primary', color.value)
                  }}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 情侣主题 */}
      <Card>
        <CardHeader>
          <CardTitle>情侣主题</CardTitle>
          <CardDescription>配置情侣双方的个性化主题色彩</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="coupleThemeEnabled"
              checked={themeConfig.coupleTheme.enabled}
              onCheckedChange={(checked) => setThemeConfig(prev => ({
                ...prev,
                coupleTheme: { ...prev.coupleTheme, enabled: checked }
              }))}
            />
            <Label htmlFor="coupleThemeEnabled">启用情侣主题</Label>
          </div>
          
          {themeConfig.coupleTheme.enabled && (
            <div className="grid grid-cols-2 gap-6">
              {/* 伴侣1 */}
              <div className="space-y-3">
                <h4 className="font-medium">伴侣1</h4>
                <div>
                  <Label htmlFor="partner1Name">姓名</Label>
                  <Input
                    id="partner1Name"
                    value={themeConfig.coupleTheme.partner1.name}
                    onChange={(e) => handleCoupleChange('partner1', 'name', e.target.value)}
                    placeholder="输入姓名"
                  />
                </div>
                <div>
                  <Label htmlFor="partner1Color">主题色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partner1Color"
                      type="color"
                      value={themeConfig.coupleTheme.partner1.color}
                      onChange={(e) => handleCoupleChange('partner1', 'color', e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={themeConfig.coupleTheme.partner1.color}
                      onChange={(e) => handleCoupleChange('partner1', 'color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* 伴侣2 */}
              <div className="space-y-3">
                <h4 className="font-medium">伴侣2</h4>
                <div>
                  <Label htmlFor="partner2Name">姓名</Label>
                  <Input
                    id="partner2Name"
                    value={themeConfig.coupleTheme.partner2.name}
                    onChange={(e) => handleCoupleChange('partner2', 'name', e.target.value)}
                    placeholder="输入姓名"
                  />
                </div>
                <div>
                  <Label htmlFor="partner2Color">主题色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partner2Color"
                      type="color"
                      value={themeConfig.coupleTheme.partner2.color}
                      onChange={(e) => handleCoupleChange('partner2', 'color', e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={themeConfig.coupleTheme.partner2.color}
                      onChange={(e) => handleCoupleChange('partner2', 'color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 字体配置 */}
      <Card>
        <CardHeader>
          <CardTitle>字体配置</CardTitle>
          <CardDescription>配置网站的字体样式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fontFamily">字体族</Label>
              <Input
                id="fontFamily"
                value={themeConfig.typography.fontFamily}
                onChange={(e) => setThemeConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, fontFamily: e.target.value }
                }))}
                placeholder="字体名称"
              />
            </div>
            <div>
              <Label htmlFor="baseFontSize">基础字号</Label>
              <Input
                id="baseFontSize"
                value={themeConfig.typography.fontSize.base}
                onChange={(e) => setThemeConfig(prev => ({
                  ...prev,
                  typography: {
                    ...prev.typography,
                    fontSize: { ...prev.typography.fontSize, base: e.target.value }
                  }
                }))}
                placeholder="16px"
              />
            </div>
            <div>
              <Label htmlFor="lineHeight">行高</Label>
              <Input
                id="lineHeight"
                value={themeConfig.typography.lineHeight}
                onChange={(e) => setThemeConfig(prev => ({
                  ...prev,
                  typography: { ...prev.typography, lineHeight: e.target.value }
                }))}
                placeholder="1.6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 动画配置 */}
      <Card>
        <CardHeader>
          <CardTitle>动画配置</CardTitle>
          <CardDescription>配置网站的动画效果</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="animationsEnabled"
              checked={themeConfig.animations.enabled}
              onCheckedChange={(checked) => setThemeConfig(prev => ({
                ...prev,
                animations: { ...prev.animations, enabled: checked }
              }))}
            />
            <Label htmlFor="animationsEnabled">启用动画效果</Label>
          </div>
          
          {themeConfig.animations.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animationDuration">动画时长</Label>
                <Input
                  id="animationDuration"
                  value={themeConfig.animations.duration}
                  onChange={(e) => setThemeConfig(prev => ({
                    ...prev,
                    animations: { ...prev.animations, duration: e.target.value }
                  }))}
                  placeholder="200ms"
                />
              </div>
              <div>
                <Label htmlFor="animationEasing">缓动函数</Label>
                <Input
                  id="animationEasing"
                  value={themeConfig.animations.easing}
                  onChange={(e) => setThemeConfig(prev => ({
                    ...prev,
                    animations: { ...prev.animations, easing: e.target.value }
                  }))}
                  placeholder="ease-in-out"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}