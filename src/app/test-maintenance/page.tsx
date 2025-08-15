'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMaintenancePage() {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const clearAllCookies = () => {
    // 清除所有可能的认证 cookies
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 清除 localStorage
    localStorage.clear();
    
    // 清除 sessionStorage
    sessionStorage.clear();
    
    setMessage('所有认证信息已清除');
    setStep(2);
  };

  const testMaintenanceRedirect = () => {
    setMessage('正在测试维护模式重定向...');
    // 延迟一下再跳转，让用户看到消息
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>测试维护模式</CardTitle>
          <CardDescription>
            这个页面用于测试维护模式功能是否正常工作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-gray-600">
                步骤 1: 清除所有认证信息，模拟非管理员用户
              </p>
              <Button onClick={clearAllCookies} className="w-full">
                清除认证信息
              </Button>
            </>
          )}
          
          {step === 2 && (
            <>
              <p className="text-sm text-green-600 mb-2">{message}</p>
              <p className="text-sm text-gray-600">
                步骤 2: 访问首页，应该被重定向到维护页面
              </p>
              <Button onClick={testMaintenanceRedirect} className="w-full">
                测试维护模式重定向
              </Button>
            </>
          )}
          
          {message && step === 2 && (
            <p className="text-sm text-blue-600">{message}</p>
          )}
          
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>注意:</strong> 如果维护模式正常工作，点击"测试维护模式重定向"后应该会跳转到维护页面。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}