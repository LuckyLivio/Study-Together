'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { 
  Save, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Ban,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'

// 类型定义，匹配Prisma schema
interface User {
  id: string
  username: string
  displayName: string
  email: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE'
  gender?: 'MALE' | 'FEMALE' | null
  bio?: string | null
  avatar?: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
  couple?: {
    id: string
    name: string | null
  } | null
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function RealUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和搜索条件变化时重新获取数据
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedRole, selectedStatus])

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // 重置到第一页
  }

  // 角色过滤
  const handleRoleFilter = (role: string) => {
    setSelectedRole(role)
    setCurrentPage(1)
  }

  // 状态过滤
  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  // 更新用户状态
  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'BANNED' | 'INACTIVE') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('更新用户状态失败')
      }

      const result = await response.json()
      toast.success(result.message)
      fetchUsers() // 重新获取用户列表
    } catch (error) {
      console.error('更新用户状态失败:', error)
      toast.error('更新用户状态失败')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除用户失败')
      }

      const result = await response.json()
      toast.success(result.message)
      setShowDeleteDialog(false)
      setDeletingUser(null)
      fetchUsers() // 重新获取用户列表
    } catch (error) {
      console.error('删除用户失败:', error)
      toast.error('删除用户失败')
    }
  }

  // 获取状态徽章样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">正常</Badge>
      case 'BANNED':
        return <Badge className="bg-red-100 text-red-800">封禁</Badge>
      case 'INACTIVE':
        return <Badge className="bg-yellow-100 text-yellow-800">暂停</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // 获取角色徽章样式
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">管理员</Badge>
      case 'MODERATOR':
        return <Badge className="bg-blue-100 text-blue-800">版主</Badge>
      case 'USER':
        return <Badge className="bg-gray-100 text-gray-800">用户</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加用户
        </Button>
      </div>

      <div className="space-y-4">
          {/* 搜索和过滤 */}
          <Card>
            <CardHeader>
              <CardTitle>搜索和过滤</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户名、显示名称或邮箱..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  className="w-[180px] h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="all">所有角色</option>
                  <option value="ADMIN">管理员</option>
                  <option value="MODERATOR">版主</option>
                  <option value="USER">用户</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-[180px] h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="all">所有状态</option>
                  <option value="ACTIVE">正常</option>
                  <option value="BANNED">封禁</option>
                  <option value="INACTIVE">暂停</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户列表
              </CardTitle>
              <CardDescription>
                共 {users.length} 个用户
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  没有找到用户
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.displayName} className="w-10 h-10 rounded-full" />
                          ) : (
                            <Users className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.displayName}</h3>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username} • {user.email}
                          </div>
                          {user.bio && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {user.bio}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            创建时间: {new Date(user.createdAt).toLocaleDateString()}
                            {user.lastLogin && (
                              <span className="ml-2">
                                最后登录: {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status === 'ACTIVE' ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                                  className="text-yellow-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  暂停用户
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(user.id, 'BANNED')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  封禁用户
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                解除限制
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingUser(user)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除用户
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* 添加用户对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新用户</DialogTitle>
            <DialogDescription>
              创建一个新的用户账户
            </DialogDescription>
          </DialogHeader>
          <AddUserForm onSuccess={() => {
            setShowAddDialog(false)
            fetchUsers()
          }} />
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户的基本信息和权限设置
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <EditUserForm 
              user={editingUser} 
              onSuccess={() => {
                setShowEditDialog(false)
                setEditingUser(null)
                fetchUsers()
              }}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingUser(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
            <DialogDescription>
              您确定要删除用户 "{deletingUser?.displayName}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingUser && handleDeleteUser(deletingUser.id)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 添加用户表单组件
function AddUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'MODERATOR' | 'USER',
    gender: '' as '' | 'MALE' | 'FEMALE' | 'OTHER'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.displayName || !formData.email || !formData.password) {
      toast.error('请填写所有必填字段')
      return
    }

    if (formData.password.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '创建用户失败')
      }

      const result = await response.json()
      toast.success('用户创建成功')
      onSuccess()
    } catch (error) {
      console.error('创建用户失败:', error)
      toast.error(error instanceof Error ? error.message : '创建用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">用户名 *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          placeholder="输入用户名"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="displayName">显示名称 *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="输入显示名称"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">邮箱 *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="输入邮箱地址"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="password">密码 *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="输入密码（至少6位）"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="role">角色</Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'MODERATOR' | 'USER' }))}
          className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="USER">用户</option>
          <option value="MODERATOR">版主</option>
          <option value="ADMIN">管理员</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="gender">性别</Label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'MALE' | 'FEMALE' | 'OTHER' }))}
          className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">请选择性别</option>
          <option value="MALE">男</option>
          <option value="FEMALE">女</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              创建中...
            </>
          ) : (
            '创建用户'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// 编辑用户表单组件
function EditUserForm({ user, onSuccess, onCancel }: { 
  user: User
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    status: user.status,
    gender: user.gender || '' as '' | 'MALE' | 'FEMALE' | 'OTHER',
    bio: user.bio || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.displayName || !formData.email) {
      toast.error('请填写所有必填字段')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '更新用户失败')
      }

      toast.success('用户信息已更新')
      onSuccess()
    } catch (error) {
      console.error('更新用户失败:', error)
      toast.error(error instanceof Error ? error.message : '更新用户失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-username">用户名 *</Label>
        <Input
          id="edit-username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          placeholder="请输入用户名"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-displayName">显示名称 *</Label>
        <Input
          id="edit-displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="请输入显示名称"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-email">邮箱 *</Label>
        <Input
          id="edit-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="请输入邮箱地址"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="edit-role">角色</Label>
        <select
          id="edit-role"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'MODERATOR' | 'USER' }))}
          className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="USER">用户</option>
          <option value="MODERATOR">版主</option>
          <option value="ADMIN">管理员</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="edit-status">状态</Label>
        <select
          id="edit-status"
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'BANNED' | 'INACTIVE' }))}
          className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="ACTIVE">活跃</option>
          <option value="INACTIVE">非活跃</option>
          <option value="BANNED">已封禁</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="edit-gender">性别</Label>
        <select
          id="edit-gender"
          value={formData.gender}
          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as '' | 'MALE' | 'FEMALE' | 'OTHER' }))}
          className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">请选择性别</option>
          <option value="MALE">男</option>
          <option value="FEMALE">女</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      
      <div>
        <Label htmlFor="edit-bio">个人简介</Label>
        <Textarea
          id="edit-bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="请输入个人简介"
          rows={3}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            '保存更改'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}