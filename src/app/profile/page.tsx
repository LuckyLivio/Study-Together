'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, User, Heart, Users, Copy, Share, Plus, CheckCircle, Shield, Key } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useSiteConfig } from '@/lib/use-site-config'

export default function ProfilePage() {
  const { user, couple, generateInviteCode, joinByInviteCode, updateProfile, changePassword, isLoading } = useAuthStore()
  const { config } = useSiteConfig()
  
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  
  // 编辑资料相关状态
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || 'MALE',
    bio: user?.bio || ''
  })
  
  // 密码修改相关状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordMessageType, setPasswordMessageType] = useState<'success' | 'error'>('success')
  
  // 当用户数据变化时更新表单
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        gender: user.gender || 'MALE',
        bio: user.bio || ''
      })
    }
  }, [user])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const showPasswordMessage = (text: string, type: 'success' | 'error') => {
    setPasswordMessage(text)
    setPasswordMessageType(type)
    setTimeout(() => setPasswordMessage(''), 5000)
  }

  const handleGenerateInvite = async () => {
    setIsGenerating(true)
    const result = await generateInviteCode()
    
    if (result.success) {
      setInviteCode(result.code || '')
      setInviteLink(result.link || '')
      showMessage(result.message, 'success')
    } else {
      showMessage(result.message, 'error')
    }
    setIsGenerating(false)
  }

  const handleUpdateProfile = async () => {
    if (!editForm.name.trim()) {
      showMessage('姓名不能为空', 'error')
      return
    }

    if (!editForm.email.trim()) {
      showMessage('邮箱不能为空', 'error')
      return
    }

    setIsUpdating(true)
    const result = await updateProfile({
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      gender: editForm.gender,
      bio: editForm.bio.trim()
    })

    if (result.success) {
      showMessage(result.message, 'success')
      setIsEditing(false)
    } else {
      showMessage(result.message, 'error')
    }
    setIsUpdating(false)
  }

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        gender: user.gender || 'MALE',
        bio: user.bio || ''
      })
    }
    setIsEditing(false)
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
    } else {
      showMessage(result.message, 'error')
    }
    setIsJoining(false)
  }

  const handleChangePassword = async () => {
    // 验证表单
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showPasswordMessage('请填写所有密码字段', 'error')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showPasswordMessage('新密码和确认密码不匹配', 'error')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showPasswordMessage('新密码长度至少为6位', 'error')
      return
    }

    setIsChangingPassword(true)
    setPasswordMessage('')

    const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      )

    if (result.success) {
      showPasswordMessage(result.message, 'success')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      showPasswordMessage(result.message, 'error')
    }

    setIsChangingPassword(false)
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">个人资料</h1>
        <p className="text-muted-foreground">管理您的个人信息和情侣设置</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">个人信息</TabsTrigger>
          <TabsTrigger value="couple">情侣设置</TabsTrigger>
          <TabsTrigger value="security">安全与密码</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人信息
              </CardTitle>
              <CardDescription>
                查看和管理您的个人信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">姓名</Label>
                  {isEditing ? (
                    <Input 
                      id="name" 
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入姓名"
                    />
                  ) : (
                    <Input id="name" value={user.name} disabled />
                  )}
                </div>
                <div>
                  <Label htmlFor="email">邮箱</Label>
                  {isEditing ? (
                    <Input 
                      id="email" 
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="请输入邮箱"
                    />
                  ) : (
                    <Input id="email" value={user.email} disabled />
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">性别</Label>
                  {isEditing ? (
                    <select 
                      id="gender"
                      value={editForm.gender}
                      onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="MALE">👨 男生</option>
                      <option value="FEMALE">👩 女生</option>
                      <option value="OTHER">🌈 其他</option>
                    </select>
                  ) : (
                    <Input 
                      id="gender" 
                      value={
                        user.gender === 'MALE' || user.gender === 'male' ? '👨 男生' : 
                        user.gender === 'FEMALE' || user.gender === 'female' ? '👩 女生' : 
                        '🌈 其他'
                      } 
                      disabled 
                      className="bg-gray-50"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="role">角色</Label>
                  <Input id="role" value={user.role === 'person1' ? '发起者' : '加入者'} disabled />
                </div>
                <div>
                  <Label htmlFor="joinDate">注册时间</Label>
                  <Input id="joinDate" value={new Date(user.createdAt).toLocaleDateString('zh-CN')} disabled />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">个人简介</Label>
                {isEditing ? (
                  <Textarea 
                    id="bio" 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="请输入个人简介"
                    rows={3}
                  />
                ) : (
                  <Textarea 
                    id="bio" 
                    value={user.bio || '暂无简介'} 
                    disabled 
                    className="bg-gray-50"
                    rows={3}
                  />
                )}
              </div>
              
              <div className="pt-4 flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="flex items-center gap-2"
                    >
                      {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                      保存修改
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      取消
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                  >
                    编辑资料
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="couple">
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
                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          onClick={handleGenerateInvite}
                          disabled={isGenerating || (couple ? !couple.isComplete : false)}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Heart className="mr-2 h-4 w-4" />
                              {couple && !couple.isComplete ? '已创建邀请' : '生成邀请码'}
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
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
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全与密码
              </CardTitle>
              <CardDescription>
                管理您的账户安全设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {passwordMessage && (
                <Alert className={`${passwordMessageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  修改密码
                </h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="请输入当前密码"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="请输入新密码（至少6位）"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="w-full"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        修改中...
                      </>
                    ) : (
                      '修改密码'
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">忘记密码</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  如果您忘记了密码，请联系管理员协助重置密码。
                </p>
                <Button variant="outline" onClick={() => window.open('mailto:admin@example.com?subject=密码重置请求&body=请协助重置我的账户密码，我的用户名是：' + (user?.email || ''), '_blank')}>
                  联系管理员
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}