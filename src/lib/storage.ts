// 本地存储工具类
export class LocalStorage {
  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('从本地存储读取失败:', error)
      return defaultValue
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('从本地存储删除失败:', error)
    }
  }

  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空本地存储失败:', error)
    }
  }
}

// 管理员设置相关的存储键
export const STORAGE_KEYS = {
  SITE_SETTINGS: 'admin_site_settings',
  THEME_SETTINGS: 'admin_theme_settings',
  API_SETTINGS: 'admin_api_settings',
  FEATURE_SETTINGS: 'admin_feature_settings',
  USER_SETTINGS: 'admin_user_settings',
  SECURITY_SETTINGS: 'security_settings',
  SECURITY_LAST_SAVED: 'security_last_saved',
  USERS: 'users',
  COUPLES: 'couples',
  AUTH_TOKEN: 'auth-token'
} as const