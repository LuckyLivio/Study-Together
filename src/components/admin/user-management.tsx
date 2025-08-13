'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Crown, 
  Users, 
  Mail, 
  Calendar,
  MoreHorizontal,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'user' | 'couple'
  status: 'active' | 'inactive' | 'banned' | 'pending'
  createdAt: string
  lastLogin: string
  permissions: string[]
  profile: {
    avatar?: string
    displayName: string
    bio?: string
  }
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  isSystem: boolean
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 模拟用户数据
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-01-15',
      permissions: ['*'],
      profile: {
        displayName: '系统管理员',
        bio: '网站管理员账户'
      }
    },
    {
      id: '2',
      username: 'couple_user1',
      email: 'user1@example.com',
      role: 'couple',
      status: 'active',
      createdAt: '2024-01-05',
      lastLogin: '2024-01-14',
      permissions: ['read', 'write', 'couple_features'],
      profile: {
        displayName: '小明',
        bio: '热爱学习的情侣用户'
      }
    },
    {
      id: '3',
      username: 'moderator1',
      email: 'mod@example.com',
      role: 'moderator',
      status: 'active',
      createdAt: '2024-01-03',
      lastLogin: '2024-01-13',
      permissions: ['read', 'write', 'moderate', 'user_management'],
      profile: {
        displayName: '版主小王',
        bio: '负责内容审核的版主'
      }
    }
  ])

  // 角色定义
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: '管理员',
      description: '拥有所有权限的系统管理员',
      permissions: ['*'],
      color: 'bg-red-100 text-red-800',
      isSystem: true
    },
    {
      id: 'moderator',
      name: '版主',
      description: '负责内容审核和用户管理',
      permissions: ['read', 'write', 'moderate', 'user_management'],
      color: 'bg-orange-100 text-orange-800',
      isSystem: true
    },
    {
      id: 'couple',
      name: '情侣用户',
      description: '可以使用情侣功能的用户',
      permissions: ['read', 'write', 'couple_features'],
      color: 'bg-pink-100 text-pink-800',
      isSystem: false
    },
    {
      id: 'user',
      name: '普通用户',
      description: '基础用户权限',
      permissions: ['read', 'write'],
      color: 'bg-blue-100 text-blue-800',
      isSystem: true
    }
  ])

  // 权限定义
  const [permissions] = useState([
    { id: '*', name: '所有权限', description: '拥有系统的所有权限', category: 'system' },
    { id: 'read', name: '读取权限', description: '查看内容的权限', category: 'basic' },
    { id: 'write', name: '写入权限', description: '创建和编辑内容的权限', category: 'basic' },
    { id: 'delete', name: '删除权限', description: '删除内容的权限', category: 'basic' },
    { id: 'moderate', name: '审核权限', description: '审核和管理内容的权限', category: 'moderation' },
    { id: 'user_management', name: '用户管理', description: '管理用户账户的权限', category: 'admin' },
    { id: 'system_settings', name: '系统设置', description: '修改系统设置的权限', category: 'admin' },
    { id: 'couple_features', name: '情侣功能', description: '使用情侣专属功能的权限', category: 'features' },
    { id: 'advanced_features', name: '高级功能', description: '使用高级功能的权限', category: 'features' },
    { id: 'api_access', name: 'API访问', description: '访问API接口的权限', category: 'api' }
  ])

  const handleSave = () => {
    toast.success('用户管理配置已更新')
  }

  const getRoleColor = (role: string) => {
    const roleObj = roles.find(r => r.id === role)
    return roleObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'banned': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'inactive': return <XCircle className="h-4 w-4" />
      case 'banned': return <Ban className="h-4 w-4" />
      case 'pending': return <Calendar className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* 用户筛选和搜索 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索用户名、邮箱或显示名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">所有角色</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
          <option value="banned">已封禁</option>
          <option value="pending">待审核</option>
        </select>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加用户
        </Button>
      </div>

      {/* 用户统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-500">总用户数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">活跃用户</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">
              {users.filter(u => u.role === 'couple').length}
            </div>
            <div className="text-sm text-gray-500">情侣用户</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'banned').length}
            </div>
            <div className="text-sm text-gray-500">封禁用户</div>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>管理系统中的所有用户账户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.profile.displayName}</span>
                      <Badge className={getRoleColor(user.role)}>
                        {roles.find(r => r.id === user.role)?.name}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1 capitalize">{user.status}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username} • {user.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      注册: {user.createdAt} • 最后登录: {user.lastLogin}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRolesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">角色管理</h3>
          <p className="text-gray-600">管理用户角色和权限组</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加角色
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{role.name}</h4>
                      <Badge className={role.color}>{role.id}</Badge>
                      {role.isSystem && (
                        <Badge variant="outline">系统角色</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!role.isSystem && (
                    <>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">权限列表:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {role.permissions.map(permission => (
                    <Badge key={permission} variant="outline">
                      {permissions.find(p => p.id === permission)?.name || permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderPermissionsTab = () => {
    const permissionCategories = {
      system: '系统权限',
      basic: '基础权限',
      moderation: '审核权限',
      admin: '管理权限',
      features: '功能权限',
      api: 'API权限'
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">权限管理</h3>
          <p className="text-gray-600">查看和管理系统中的所有权限</p>
        </div>

        {Object.entries(permissionCategories).map(([category, categoryName]) => {
          const categoryPermissions = permissions.filter(p => p.category === category)
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{categoryName}</CardTitle>
                <CardDescription>
                  {categoryPermissions.length} 个权限
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {categoryPermissions.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-gray-500">{permission.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          权限ID: {permission.id}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {roles.filter(role => role.permissions.includes(permission.id) || role.permissions.includes('*')).length} 个角色使用
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
          <p className="text-gray-600">管理用户账户、角色和权限</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          保存配置
        </Button>
      </div>

      {/* 标签页导航 */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'users', name: '用户管理', icon: Users },
            { id: 'roles', name: '角色管理', icon: Shield },
            { id: 'permissions', name: '权限管理', icon: Crown }
          ].map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'roles' && renderRolesTab()}
      {activeTab === 'permissions' && renderPermissionsTab()}
    </div>
  )
}