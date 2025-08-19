'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Heart, Users, Copy, Share, Plus, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useSiteConfig } from '@/lib/use-site-config'
import { useRouter } from 'next/navigation'

export default function CouplePage() {
  const { user, couple, generateInviteCode, joinByInviteCode, unbindCouple, refreshUserState, isLoading } = useAuthStore()
  const { config } = useSiteConfig()
  const router = useRouter()
  
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [isUnbinding, setIsUnbinding] = useState(false)
  const [showUnbindDialog, setShowUnbindDialog] = useState(false)

  // 页面加载时刷新用户状态
  useEffect(() => {
    refreshUserState()
  }, [])

  // 检查是否已有邀请码
  useEffect(() => {
    if (couple && !couple.isComplete && couple.inviteCode) {
      setInviteCode(couple.inviteCode)
      const link = `${window.location.origin}/register?invite=${couple.inviteCode}`
      setInviteLink(link)
    }
    // 如果couple变为null或complete，不清除本地状态，保持邀请码显示
  }, [couple])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleGenerateInvite = async () => {
    if (isGenerating) return
    
    // 如果已经有邀请码，直接显示对话框
    if (couple && !couple.isComplete && couple.inviteCode && inviteCode) {
      setShowInviteDialog(true)
      return
    }
    
    setIsGenerating(true)
    
    try {
      const result = await generateInviteCode()
      
      if (result.success) {
        setInviteCode(result.code || '')
        setInviteLink(result.link || '')
        showMessage(result.message, 'success')
        
        // 生成成功后打开对话框
        setShowInviteDialog(true)
      } else {
        showMessage(result.message, 'error')
      }
    } catch (error) {
      console.error('生成邀请码异常:', error)
      showMessage('生成邀请码失败，请稍后重试', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleJoinCouple = async () => {
    if (!joinCode.trim()) {
      showMessage('请输入邀请码', 'error')
      return
    }

    setIsJoining(true)
    const result = await joinByInviteCode(joinCode.trim().toUpperCase())
    
    if (result.success) {
      showMessage(result.message, 'success')
      setJoinCode('')
      setShowJoinDialog(false)
      // 刷新用户状态以获取最新的情侣信息
      await refreshUserState()
    } else {
      showMessage(result.message, 'error')
    }
    setIsJoining(false)
  }

  const handleUnbindCouple = async () => {
    setIsUnbinding(true)
    const result = await unbindCouple()
    
    if (result.success) {
      showMessage(result.message, 'success')
      setShowUnbindDialog(false)
    } else {
      showMessage(result.message, 'error')
    }
    setIsUnbinding(false)
  }

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      showMessage(`${type === 'code' ? '邀请码' : '邀请链接'}已复制到剪贴板`, 'success')
    } catch (err) {
      showMessage('复制失败，请手动复制', 'error')
    }
  }

  const shareInvite = async () => {
    if (navigator.share && inviteLink) {
      try {
        await navigator.share({
          title: `加入我的${config.name}`,
          text: `我邀请你加入我的情侣学习空间！`,
          url: inviteLink
        })
      } catch (err) {
        // 分享失败，回退到复制
        copyToClipboard(inviteLink, 'link')
      }
    } else {
      copyToClipboard(inviteLink, 'link')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 top-16 overflow-hidden">
      <div className="h-full overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">情侣设置</h1>
            <p className="text-muted-foreground">管理您的情侣关系和学习空间</p>
          </div>

      {message && (
        <Alert className={`mb-6 ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* 情侣状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              情侣状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {couple && couple.isComplete ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已配对
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>我的名字</Label>
                    <p className="text-sm font-medium">
                      {user.role === 'person1' ? couple.person1Name : couple.person2Name}
                    </p>
                  </div>
                  <div>
                    <Label>伴侣名字</Label>
                    <p className="text-sm font-medium">
                      {user.role === 'person1' ? couple.person2Name : couple.person1Name}
                    </p>
                  </div>
                  <div>
                    <Label>配对时间</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(couple.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <Label>情侣ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {couple.id}
                    </p>
                  </div>
                </div>
                
                {/* 解绑按钮 */}
                <div className="pt-4 border-t">
                  <Dialog open={showUnbindDialog} onOpenChange={setShowUnbindDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        解除情侣关系
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>确认解除情侣关系</DialogTitle>
                        <DialogDescription>
                          此操作将永久解除您与{user.role === 'person1' ? couple.person2Name : couple.person1Name}的情侣关系，无法撤销。您确定要继续吗？
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowUnbindDialog(false)}
                          disabled={isUnbinding}
                        >
                          取消
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleUnbindCouple}
                          disabled={isUnbinding}
                        >
                          {isUnbinding ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              解绑中...
                            </>
                          ) : (
                            '确认解绑'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : couple && !couple.isComplete ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    等待配对
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  您已创建情侣空间，正在等待伴侣加入。请分享邀请码给您的伴侣。
                </p>
                <div className="flex items-center gap-2">
                  <Input value={couple.inviteCode} disabled className="font-mono" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(couple.inviteCode, 'code')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    未配对
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  您还没有情侣伴侣。您可以创建邀请码邀请伴侣，或使用伴侣的邀请码加入。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 情侣操作 */}
        {(!couple || !couple.isComplete) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 创建邀请 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  创建邀请
                </CardTitle>
                <CardDescription>
                  生成邀请码，让您的伴侣加入
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleGenerateInvite}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      {couple ? (couple.isComplete ? '重新生成邀请码' : (inviteCode ? '查看邀请码' : '生成邀请码')) : '生成邀请码'}
                    </>
                  )}
                </Button>
                
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  {inviteCode && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>邀请码已生成</DialogTitle>
                        <DialogDescription>
                          请将以下邀请码或链接分享给您的伴侣
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>邀请码</Label>
                          <div className="flex items-center gap-2">
                            <Input value={inviteCode} disabled className="font-mono text-lg" />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(inviteCode, 'code')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>邀请链接</Label>
                          <div className="flex items-center gap-2">
                            <Input value={inviteLink} disabled className="text-sm" />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(inviteLink, 'link')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button onClick={shareInvite} className="w-full">
                          <Share className="mr-2 h-4 w-4" />
                          分享邀请
                        </Button>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </CardContent>
            </Card>

            {/* 加入情侣 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  加入情侣
                </CardTitle>
                <CardDescription>
                  使用伴侣的邀请码加入情侣空间
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      输入邀请码
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>加入情侣空间</DialogTitle>
                      <DialogDescription>
                        请输入您伴侣分享的邀请码
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="joinCode">邀请码</Label>
                        <Input
                          id="joinCode"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="输入6位邀请码"
                          className="font-mono text-lg"
                          maxLength={6}
                        />
                      </div>
                      <Button 
                        onClick={handleJoinCouple} 
                        className="w-full"
                        disabled={isJoining || !joinCode.trim()}
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            加入中...
                          </>
                        ) : (
                          <>
                            <Heart className="mr-2 h-4 w-4" />
                            加入情侣
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}