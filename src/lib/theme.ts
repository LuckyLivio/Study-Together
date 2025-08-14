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

// 其他性别主题 - 紫色系
export const otherTheme: GenderTheme = {
  primary: 'bg-purple-600 hover:bg-purple-700',
  primaryHover: 'hover:bg-purple-700',
  primaryLight: 'bg-purple-50',
  accent: 'text-purple-600',
  gradient: 'from-purple-50 to-indigo-50',
  icon: 'text-purple-600'
}

// 根据性别获取主题
export const getThemeByGender = (gender: 'male' | 'female' | 'MALE' | 'FEMALE' | 'OTHER' | 'other'): GenderTheme => {
  const normalizedGender = gender?.toLowerCase()
  switch (normalizedGender) {
    case 'male':
      return maleTheme
    case 'female':
      return femaleTheme
    case 'other':
      return otherTheme
    default:
      return femaleTheme // 默认主题
  }
}

// 主题类名生成器
export const getThemeClasses = (gender: 'male' | 'female' | 'MALE' | 'FEMALE' | 'OTHER' | 'other') => {
  const theme = getThemeByGender(gender)
  const normalizedGender = gender?.toLowerCase()
  
  const getColorName = () => {
    switch (normalizedGender) {
      case 'male': return 'blue'
      case 'female': return 'pink'
      case 'other': return 'purple'
      default: return 'pink'
    }
  }
  
  const colorName = getColorName()
  
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
    inputFocus: `focus:ring-2 focus:ring-${colorName}-500`,
    
    // 状态样式
    success: `text-${colorName}-600 bg-${colorName}-50`,
    
    // 特殊组件
    heart: theme.icon,
    avatar: `ring-4 ring-${colorName}-200`
  }
}

// CSS变量形式的主题（用于动态样式）
export const getThemeVariables = (gender: 'male' | 'female' | 'MALE' | 'FEMALE' | 'OTHER' | 'other') => {
  const theme = getThemeByGender(gender)
  const normalizedGender = gender?.toLowerCase()
  
  const getColors = () => {
    switch (normalizedGender) {
      case 'male':
        return {
          primary: '#2563eb',
          primaryLight: '#eff6ff',
          accent: '#3b82f6'
        }
      case 'female':
        return {
          primary: '#ec4899',
          primaryLight: '#fdf2f8',
          accent: '#f472b6'
        }
      case 'other':
        return {
          primary: '#9333ea',
          primaryLight: '#faf5ff',
          accent: '#a855f7'
        }
      default:
        return {
          primary: '#ec4899',
          primaryLight: '#fdf2f8',
          accent: '#f472b6'
        }
    }
  }
  
  const colors = getColors()
  
  return {
    '--theme-primary': colors.primary,
    '--theme-primary-light': colors.primaryLight,
    '--theme-accent': colors.accent,
  }
}

// 默认主题（未登录时使用）
export const defaultTheme = femaleTheme // 默认使用粉色主题