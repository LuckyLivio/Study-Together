'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Save, Settings, Users, MessageSquare, Calendar, BookOpen, Heart, Shield, Zap, Globe } from 'lucide-react'
import { toast } from 'sonner'

export function FeatureSettings() {
  const [features, setFeatures] = useState({
    // 核心功能
    core: {
      userRegistration: {
        enabled: true,
        name: '用户注册',
        description: '允许新用户注册账户',
        icon: Users,
        category: 'core',
        requiresRestart: false,
        settings: {
          emailVerification: true,
          autoApproval: true,
          inviteOnly: false
        }
      },
      userProfiles: {
        enabled: true,
        name: '用户资料',
        description: '用户个人资料管理',
        icon: Users,
        category: 'core',
        requiresRestart: false,
        settings: {
          publicProfiles: true,
          profilePictures: true,
          customFields: true
        }
      },
      messaging: {
        enabled: true,
        name: '消息系统',
        description: '用户间私信和群聊功能',
        icon: MessageSquare,
        category: 'core',
        requiresRestart: false,
        settings: {
          privateMessages: true,
          groupChats: true,
          fileSharing: true,
          messageHistory: 30 // 天数
        }
      }
    },
    
    // 学习功能
    learning: {
      studyPlans: {
        enabled: true,
        name: '学习计划',
        description: '创建和管理学习计划',
        icon: BookOpen,
        category: 'learning',
        requiresRestart: false,
        settings: {
          sharedPlans: true,
          planTemplates: true,
          progressTracking: true,
          reminders: true
        }
      },
      studyRooms: {
        enabled: true,
        name: '学习室',
        description: '虚拟学习空间和专注模式',
        icon: BookOpen,
        category: 'learning',
        requiresRestart: false,
        settings: {
          publicRooms: true,
          privateRooms: true,
          roomCapacity: 50,
          focusMode: true
        }
      },
      progressTracking: {
        enabled: true,
        name: '进度追踪',
        description: '学习进度统计和分析',
        icon: BookOpen,
        category: 'learning',
        requiresRestart: false,
        settings: {
          dailyGoals: true,
          weeklyReports: true,
          achievements: true,
          leaderboards: false
        }
      }
    },
    
    // 情侣功能
    couple: {
      coupleMode: {
        enabled: true,
        name: '情侣模式',
        description: '情侣专属功能和界面',
        icon: Heart,
        category: 'couple',
        requiresRestart: true,
        settings: {
          coupleProfiles: true,
          sharedCalendar: true,
          anniversaryReminders: true,
          coupleGoals: true
        }
      },
      sharedStudy: {
        enabled: true,
        name: '共同学习',
        description: '情侣共同学习功能',
        icon: Heart,
        category: 'couple',
        requiresRestart: false,
        settings: {
          syncedSessions: true,
          sharedNotes: true,
          mutualEncouragement: true,
          competitiveMode: true
        }
      },
      memoryBook: {
        enabled: true,
        name: '回忆录',
        description: '记录学习和生活的美好时光',
        icon: Heart,
        category: 'couple',
        requiresRestart: false,
        settings: {
          photoAlbums: true,
          milestoneTracking: true,
          privateNotes: true,
          exportFeature: true
        }
      }
    },
    
    // 社交功能
    social: {
      forums: {
        enabled: true,
        name: '论坛',
        description: '学习讨论和交流论坛',
        icon: MessageSquare,
        category: 'social',
        requiresRestart: false,
        settings: {
          publicPosts: true,
          anonymousPosts: false,
          postModeration: true,
          votingSystem: true
        }
      },
      studyGroups: {
        enabled: true,
        name: '学习小组',
        description: '创建和加入学习小组',
        icon: Users,
        category: 'social',
        requiresRestart: false,
        settings: {
          publicGroups: true,
          privateGroups: true,
          groupLimit: 20,
          groupModeration: true
        }
      },
      events: {
        enabled: true,
        name: '活动系统',
        description: '学习活动和挑战',
        icon: Calendar,
        category: 'social',
        requiresRestart: false,
        settings: {
          publicEvents: true,
          eventRegistration: true,
          eventReminders: true,
          eventRewards: true
        }
      }
    },
    
    // 高级功能
    advanced: {
      aiAssistant: {
        enabled: false,
        name: 'AI助手',
        description: '智能学习助手和建议',
        icon: Zap,
        category: 'advanced',
        requiresRestart: true,
        settings: {
          studyRecommendations: true,
          questionAnswering: true,
          progressAnalysis: true,
          personalizedTips: true
        }
      },
      analytics: {
        enabled: true,
        name: '数据分析',
        description: '详细的学习数据分析',
        icon: Zap,
        category: 'advanced',
        requiresRestart: false,
        settings: {
          userAnalytics: true,
          performanceMetrics: true,
          customReports: true,
          dataExport: true
        }
      },
      integrations: {
        enabled: false,
        name: '第三方集成',
        description: '与外部服务的集成',
        icon: Globe,
        category: 'advanced',
        requiresRestart: true,
        settings: {
          calendarSync: false,
          notificationServices: false,
          cloudStorage: false,
          socialLogin: true
        }
      }
    },
    
    // 安全功能
    security: {
      twoFactorAuth: {
        enabled: false,
        name: '双因素认证',
        description: '增强账户安全性',
        icon: Shield,
        category: 'security',
        requiresRestart: false,
        settings: {
          smsAuth: false,
          emailAuth: true,
          appAuth: false,
          backupCodes: true
        }
      },
      contentModeration: {
        enabled: true,
        name: '内容审核',
        description: '自动内容审核和过滤',
        icon: Shield,
        category: 'security',
        requiresRestart: false,
        settings: {
          autoModeration: true,
          manualReview: true,
          reportSystem: true,
          wordFilter: true
        }
      },
      privacyControls: {
        enabled: true,
        name: '隐私控制',
        description: '用户隐私设置和控制',
        icon: Shield,
        category: 'security',
        requiresRestart: false,
        settings: {
          profileVisibility: true,
          dataDownload: true,
          accountDeletion: true,
          cookieConsent: true
        }
      }
    }
  })

  const categories = {
    core: { name: '核心功能', color: 'bg-blue-100 text-blue-800' },
    learning: { name: '学习功能', color: 'bg-green-100 text-green-800' },
    couple: { name: '情侣功能', color: 'bg-pink-100 text-pink-800' },
    social: { name: '社交功能', color: 'bg-purple-100 text-purple-800' },
    advanced: { name: '高级功能', color: 'bg-orange-100 text-orange-800' },
    security: { name: '安全功能', color: 'bg-red-100 text-red-800' }
  }

  const handleSave = () => {
    // 这里应该调用API保存配置
    const requiresRestart = Object.values(features).some(category => 
      Object.values(category).some(feature => feature.requiresRestart && feature.enabled)
    )
    
    if (requiresRestart) {
      toast.warning('某些功能需要重启服务器才能生效')
    } else {
      toast.success('功能配置已更新')
    }
  }

  const toggleFeature = (category: string, featureKey: string) => {
    setFeatures(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [featureKey]: {
          ...(prev[category as keyof typeof prev] as any)[featureKey],
          enabled: !(prev[category as keyof typeof prev] as any)[featureKey].enabled
        }
      }
    }))
  }

  const updateFeatureSetting = (category: string, featureKey: string, settingKey: string, value: any) => {
    setFeatures(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [featureKey]: {
          ...(prev[category as keyof typeof prev] as any)[featureKey],
          settings: {
            ...(prev[category as keyof typeof prev] as any)[featureKey].settings,
            [settingKey]: value
          }
        }
      }
    }))
  }

  const getEnabledCount = (category: any) => {
    return Object.values(category).filter((feature: any) => feature.enabled).length
  }

  const getTotalCount = (category: any) => {
    return Object.values(category).length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">功能开关</h2>
          <p className="text-gray-600">管理网站的各种功能模块和设置</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>

      {/* 功能概览 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(categories).map(([key, category]) => {
          const categoryFeatures = features[key as keyof typeof features]
          const enabled = getEnabledCount(categoryFeatures)
          const total = getTotalCount(categoryFeatures)
          
          return (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <Badge className={category.color}>
                  {category.name}
                </Badge>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{enabled}/{total}</div>
                  <div className="text-sm text-gray-500">已启用</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 功能详细配置 */}
      {Object.entries(features).map(([categoryKey, categoryFeatures]) => {
        const category = categories[categoryKey as keyof typeof categories]
        
        return (
          <Card key={categoryKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={category.color}>
                  {category.name}
                </Badge>
                <span className="text-sm text-gray-500">
                  ({getEnabledCount(categoryFeatures)}/{getTotalCount(categoryFeatures)} 已启用)
                </span>
              </CardTitle>
              <CardDescription>
                管理 {category.name.toLowerCase()} 相关的功能设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(categoryFeatures).map(([featureKey, feature]) => {
                const IconComponent = feature.icon
                
                return (
                  <div key={featureKey} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {feature.name}
                            {feature.requiresRestart && (
                              <Badge variant="outline" className="text-xs">
                                需重启
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">{feature.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => toggleFeature(categoryKey, featureKey)}
                      />
                    </div>
                    
                    {feature.enabled && (
                      <div className="ml-8 space-y-3 border-t pt-4">
                        <h5 className="font-medium text-sm">详细设置</h5>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(feature.settings).map(([settingKey, settingValue]) => (
                            <div key={settingKey} className="flex items-center justify-between">
                              <Label className="text-sm capitalize">
                                {settingKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </Label>
                              {typeof settingValue === 'boolean' ? (
                                <Switch
                                  checked={settingValue}
                                  onCheckedChange={(checked) => 
                                    updateFeatureSetting(categoryKey, featureKey, settingKey, checked)
                                  }
                                />
                              ) : typeof settingValue === 'number' ? (
                                <Input
                                  type="number"
                                  value={String(settingValue)}
                                  onChange={(e) => 
                                    updateFeatureSetting(categoryKey, featureKey, settingKey, parseInt(e.target.value) || 0)
                                  }
                                  className="w-20"
                                />
                              ) : (
                                <Input
                                  value={String(settingValue)}
                                  onChange={(e) => 
                                    updateFeatureSetting(categoryKey, featureKey, settingKey, e.target.value)
                                  }
                                  className="w-32"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}