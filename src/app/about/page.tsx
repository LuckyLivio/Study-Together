'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  BookOpen, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  Calendar,
  MessageSquare,
  Bot,
  FileText,
  Cloud,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useSiteConfig } from '@/lib/use-site-config';

export default function AboutPage() {
  const { config, isLoading } = useSiteConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const features = [
    {
      icon: BookOpen,
      title: "学习计划管理",
      description: "制定个人和共同的学习计划，跟踪学习进度，设置学习目标和里程碑。",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Calendar,
      title: "日程同步",
      description: "同步彼此的学习日程，合理安排共同学习时间，避免时间冲突。",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Bot,
      title: "AI学习助手",
      description: "智能AI助手提供学习建议、答疑解惑，个性化推荐学习资源。",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: MessageSquare,
      title: "情侣留言墙",
      description: "专属的留言空间，分享学习心得，互相鼓励，记录美好时光。",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: FileText,
      title: "文件共享",
      description: "安全地分享学习资料、笔记和文档，建立共同的知识库。",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Cloud,
      title: "云端同步",
      description: "所有数据云端存储，随时随地访问，多设备无缝同步。",
      color: "bg-cyan-100 text-cyan-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Heart className="h-16 w-16 text-pink-500" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            关于 <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">{config.name}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            一个专为情侣设计的共同学习平台，让爱情与知识一起成长
          </p>
        </div>

        {/* 项目介绍 */}
        <div className="mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">项目愿景</CardTitle>
            </CardHeader>
            <CardContent className="text-lg text-gray-700 leading-relaxed">
              <p className="mb-4">
                在这个快节奏的时代，情侣们往往因为各自的学习和工作而缺少共同的时光。
                <strong className="text-blue-600">{config.name}</strong> 的诞生就是为了解决这个问题。
              </p>
              <p className="mb-4">
                我们相信，<strong className="text-pink-600">爱情和学习并不冲突</strong>，
                反而可以相互促进。通过共同学习，情侣们不仅能够提升自己，
                还能在这个过程中加深彼此的了解和感情。
              </p>
              <p>
                这个平台提供了一系列贴心的功能，帮助情侣们更好地规划学习时间，
                分享学习成果，并在学习的道路上互相支持和鼓励。
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 功能特色 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${feature.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 技术特点 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">技术特点</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  <span>安全可靠</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li>• 端到端加密保护隐私</li>
                  <li>• 安全的用户认证系统</li>
                  <li>• 定期数据备份</li>
                  <li>• 严格的权限控制</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <span>现代化设计</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-700">
                  <li>• 响应式设计，支持多设备</li>
                  <li>• 直观友好的用户界面</li>
                  <li>• 流畅的交互体验</li>
                  <li>• 个性化主题定制</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 使用场景 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">适用场景</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">考研备考</h3>
              <p className="text-gray-600">共同制定复习计划，分享学习资料，互相监督进度</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">技能学习</h3>
              <p className="text-gray-600">一起学习新技能，编程、设计、语言等各种领域</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">兴趣培养</h3>
              <p className="text-gray-600">培养共同兴趣爱好，增进感情，丰富生活</p>
            </div>
          </div>
        </div>

        {/* 行动号召 */}
        <div className="bg-gradient-to-r from-blue-500 to-pink-500 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            加入我们，开启属于你们的学习之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                立即开始
                <Heart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/landing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-black bg-white hover:bg-gray-100">
                返回首页
                <ArrowLeft className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 {config.name}. Made with ❤️ for couples who study together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}