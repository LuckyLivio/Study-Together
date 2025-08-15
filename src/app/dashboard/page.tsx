'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, BookOpen, Target, Users, MessageSquare } from 'lucide-react'
import StudyTaskManager from '@/components/study/study-task-manager'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/landing')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">学习仪表盘</h1>
          <p className="text-gray-600">管理你的学习计划，追踪学习目标，与伴侣一起进步</p>
        </div>

        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="study" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              学习管理
            </TabsTrigger>
            <TabsTrigger value="couple" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              情侣空间
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI助手
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              数据概览
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-6">
            <StudyTaskManager />
          </TabsContent>

          <TabsContent value="couple" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    情侣互动
                  </CardTitle>
                  <CardDescription>
                    与你的学习伴侣一起制定目标，分享进度
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Link href="/couple">
                      <Button className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        进入情侣空间
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>学习统计</CardTitle>
                  <CardDescription>
                    查看你和伴侣的学习数据对比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">功能开发中...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  AI学习助手
                </CardTitle>
                <CardDescription>
                  智能AI助手帮助你解答学习问题，制定学习计划
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Link href="/ai">
                    <Button className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      开始对话
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>今日学习</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                    <p className="text-gray-500">已完成任务</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>学习时长</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">0h</div>
                    <p className="text-gray-500">今日学习</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>目标进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">0%</div>
                    <p className="text-gray-500">完成度</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}