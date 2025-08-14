// 基于性别的UI主题系统

export type GenderTheme = {
  primary: string
  primaryHover: string
  primaryLight: string
  accent: string
  gradient: string
  icon: string
}

// 男生主题 - 蓝色系
export const maleTheme: GenderTheme = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  primaryHover: 'hover:bg-blue-700',
  primaryLight: 'bg-blue-50',
  accent: 'text-blue-600',
  gradient: 'from-blue-50 to-indigo-50',
  icon: 'text-blue-600'
}

// 女生主题 - 粉色系
export const femaleTheme: GenderTheme = {
  primary: 'bg-pink-600 hover:bg-pink-700',
  primaryHover: 'hover:bg-pink-700',
  primaryLight: 'bg-pink-50',
  accent: 'text-pink-600',
  gradient: 'from-pink-50 to-purple-50',
  icon: 'text-pink-600'
}

// 根据性别获取主题
export const getThemeByGender = (gender: 'male' | 'female'): GenderTheme => {
  return gender === 'male' ? maleTheme : femaleTheme
}

// 主题类名生成器
export const getThemeClasses = (gender: 'male' | 'female') => {
  const theme = getThemeByGender(gender)
  
  return {
    // 按钮样式
    button: `${theme.primary} text-white`,
    buttonSecondary: `border-2 ${theme.accent} bg-transparent ${theme.accent} ${theme.primaryHover}`,
    
    // 背景样式
    background: `bg-gradient-to-br ${theme.gradient}`,
    cardAccent: theme.primaryLight,
    
    // 文本样式
    textAccent: theme.accent,
    iconAccent: theme.icon,
    
    // 链接样式
    link: `${theme.accent} ${theme.primaryHover}`,
    
    // 表单样式
    inputFocus: `focus:ring-2 focus:ring-${gender === 'male' ? 'blue' : 'pink'}-500`,
    
    // 状态样式
    success: gender === 'male' ? 'text-blue-600 bg-blue-50' : 'text-pink-600 bg-pink-50',
    
    // 特殊组件
    heart: theme.icon,
    avatar: `ring-4 ring-${gender === 'male' ? 'blue' : 'pink'}-200`
  }
}

// CSS变量形式的主题（用于动态样式）
export const getThemeVariables = (gender: 'male' | 'female') => {
  const theme = getThemeByGender(gender)
  
  return {
    '--theme-primary': gender === 'male' ? '#2563eb' : '#dc2626',
    '--theme-primary-light': gender === 'male' ? '#eff6ff' : '#fef2f2',
    '--theme-accent': gender === 'male' ? '#3b82f6' : '#ec4899',
  }
}

// 默认主题（未登录时使用）
export const defaultTheme = femaleTheme // 默认使用粉色主题