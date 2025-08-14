'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugPage() {
  const { user, couple, isAuthenticated, isLoading, refreshUserState } = useAuthStore()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const testApiCall = async () => {
    try {
      setApiError(null)
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setApiResponse({ status: response.status, data })
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '未知错误')
    }
  }

  useEffect(() => {
    testApiCall()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">调试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 前端状态 */}
        <Card>
          <CardHeader>
            <CardTitle>前端状态 (Zustand Store)</CardTitle>
            <CardDescription>当前前端状态管理中的数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                认证状态: {isAuthenticated ? '已认证' : '未认证'}
              </Badge>
            </div>
            
            <div>
              <Badge variant={isLoading ? "secondary" : "outline"}>
                加载状态: {isLoading ? '加载中' : '空闲'}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-semibold">用户信息:</h4>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {user ? JSON.stringify(user, null, 2) : '无用户数据'}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">情侣信息:</h4>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {couple ? JSON.stringify(couple, null, 2) : '无情侣数据'}
              </pre>
            </div>
            
            <Button onClick={refreshUserState} className="w-full">
              刷新用户状态
            </Button>
          </CardContent>
        </Card>
        
        {/* API 响应 */}
        <Card>
          <CardHeader>
            <CardTitle>API 响应 (/api/auth/me)</CardTitle>
            <CardDescription>后端API返回的数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="text-red-600">
                <h4 className="font-semibold">错误:</h4>
                <p>{apiError}</p>
              </div>
            )}
            
            {apiResponse && (
              <div>
                <Badge variant={apiResponse.status === 200 ? "default" : "destructive"}>
                  状态码: {apiResponse.status}
                </Badge>
                <h4 className="font-semibold mt-2">响应数据:</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(apiResponse.data, null, 2)}
                </pre>
              </div>
            )}
            
            <Button onClick={testApiCall} className="w-full">
              重新测试 API
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* 浏览器存储 */}
      <Card>
        <CardHeader>
          <CardTitle>浏览器存储</CardTitle>
          <CardDescription>LocalStorage 和 Cookie 信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">LocalStorage (auth-storage):</h4>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {typeof window !== 'undefined' 
                  ? localStorage.getItem('auth-storage') || '无数据'
                  : '服务端渲染'}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">Cookies:</h4>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {typeof window !== 'undefined' 
                  ? document.cookie || '无 Cookie'
                  : '服务端渲染'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}