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
import { Loader2, User, Shield, Key } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useSiteConfig } from '@/lib/use-site-config'
import PasswordPolicyValidator from '@/components/ui/password-policy-validator'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, isLoading } = useAuthStore()
  
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
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
        name: user.name || '',
        email: user.email || '',
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

    // 密码策略验证将在后端进行，这里只做基本检查

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
        <p className="text-muted-foreground">管理您的个人信息和账户安全</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${messageType === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">个人信息</TabsTrigger>
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
                  
                  <PasswordPolicyValidator
                    password={passwordForm.newPassword}
                    onPasswordChange={(newPassword) => setPasswordForm(prev => ({ ...prev, newPassword }))}
                    label="新密码"
                    placeholder="请输入新密码"
                  />
                  
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