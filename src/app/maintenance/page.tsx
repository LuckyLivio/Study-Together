'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Clock } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('网站正在维护中，请稍后访问')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // 从URL参数获取维护信息
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage))
    }
  }, [searchParams])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // 刷新页面检查维护状态
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              网站维护中
            </CardTitle>
            <CardDescription className="text-gray-600">
              我们正在对网站进行维护升级
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 维护信息 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-orange-900 mb-1">维护说明</h3>
                  <p className="text-orange-800 text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* 预计时间 */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                维护期间网站暂时无法访问
              </p>
              <p className="text-sm text-gray-500">
                感谢您的耐心等待
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full"
                variant="default"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重新检查
                  </>
                )}
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </Link>
            </div>

            {/* 联系信息 */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                如有紧急问题，请联系管理员
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Study Together Team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}