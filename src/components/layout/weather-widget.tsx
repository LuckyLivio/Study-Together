'use client'

import { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeatherData {
  temperature: number
  description: string
  icon: string
  location: string
  humidity: number
  windSpeed: number
  feelsLike: number
  pressure: number
  visibility: number
  uvIndex: number
  windDir: string
  updateTime: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const detailsRef = useRef<HTMLDivElement>(null)

  const getWeatherIcon = (iconCode: string) => {
    const code = iconCode.toLowerCase()
    if (code.includes('01')) return <Sun className="h-4 w-4 text-yellow-500" />
    if (code.includes('02') || code.includes('03') || code.includes('04')) return <Cloud className="h-4 w-4 text-gray-500" />
    if (code.includes('09') || code.includes('10') || code.includes('11')) return <CloudRain className="h-4 w-4 text-blue-500" />
    if (code.includes('13')) return <CloudSnow className="h-4 w-4 text-blue-300" />
    return <Cloud className="h-4 w-4 text-gray-500" />
  }



  // IP地址定位函数
  const fetchLocationByIP = async (): Promise<{latitude: number, longitude: number, city: string}> => {
    try {
      // 使用免费的IP定位服务
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) {
        throw new Error(`IP定位请求失败: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('IP定位响应:', data)
      
      if (!data.latitude || !data.longitude) {
        throw new Error('IP定位返回的坐标无效')
      }
      
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city || '未知城市'
      }
    } catch (error) {
      console.error('IP定位失败:', error)
      // 如果IP定位也失败，返回北京的坐标作为默认值
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        city: '北京'
      }
    }
  }

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    
    // 将locationName提升到函数作用域
    let locationName = '当前位置'

    try {
      const API_KEY = process.env.NEXT_PUBLIC_AMAP_API_KEY || 'demo_key'
      const WEATHER_URL = process.env.NEXT_PUBLIC_AMAP_WEATHER_URL || 'https://restapi.amap.com/v3/weather/weatherInfo'
      const REGEO_URL = process.env.NEXT_PUBLIC_AMAP_REGEO_URL || 'https://restapi.amap.com/v3/geocode/regeo'
      console.log('天气组件: 开始获取天气数据, API_KEY:', API_KEY ? '已配置' : '未配置')
      
      // 使用IP定位获取位置
      let position
      
      console.log('天气组件: 使用IP地址定位')
      try {
        const ipLocation = await fetchLocationByIP()
        console.log('天气组件: IP定位成功:', ipLocation)
        position = {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude
        }
        locationName = ipLocation.city
      } catch (ipError) {
        console.log('天气组件: IP定位失败，使用默认位置 (北京)')
        position = {
          latitude: 39.9042,
          longitude: 116.4074
        }
        locationName = '北京'
      }
      
      // 如果是演示密钥，使用模拟数据
      if (API_KEY === 'demo_key') {
        console.log('天气组件: 使用演示模式，返回模拟数据')
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setWeather({
        temperature: 22,
        description: '晴',
        icon: '100',
        location: locationName,
        humidity: 65,
        windSpeed: 3.2,
        feelsLike: 24,
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        windDir: '东南风',
        updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
        return
      }
      

       
       // 使用高德天气API
       console.log('天气组件: 使用高德天气API')
       
       // 第一步：通过逆地理编码获取城市adcode
       const regeoUrl = `${REGEO_URL}?key=${API_KEY}&location=${position.longitude},${position.latitude}`
       console.log('天气组件: 请求逆地理编码API:', regeoUrl)
       
       const regeoResponse = await fetch(regeoUrl)
       console.log('天气组件: 逆地理编码API响应状态:', regeoResponse.status)
       
       if (!regeoResponse.ok) {
         throw new Error(`逆地理编码失败: ${regeoResponse.status}`)
       }
       
       const regeoData = await regeoResponse.json()
       console.log('天气组件: 逆地理编码API响应数据:', regeoData)
       
       if (regeoData.status !== '1') {
         throw new Error(`高德逆地理编码API错误: ${regeoData.info}`)
       }
       
       const adcode = regeoData.regeocode?.addressComponent?.adcode
       const apiLocationName = regeoData.regeocode?.addressComponent?.district || regeoData.regeocode?.addressComponent?.city || locationName
       
       if (!adcode) {
         throw new Error('无法获取城市编码')
       }
       
       console.log('天气组件: 获取到城市编码:', adcode, '位置名称:', locationName)
       
       // 第二步：使用adcode查询天气信息
       const weatherUrl = `${WEATHER_URL}?key=${API_KEY}&city=${adcode}&extensions=base`
       console.log('天气组件: 请求天气API:', weatherUrl)
       
       const weatherResponse = await fetch(weatherUrl)
       console.log('天气组件: 天气API响应状态:', weatherResponse.status)
       
       if (!weatherResponse.ok) {
         throw new Error(`天气数据获取失败: ${weatherResponse.status}`)
       }
       
       const weatherData = await weatherResponse.json()
       console.log('天气组件: 天气API响应数据:', weatherData)
       
       if (weatherData.status !== '1') {
         throw new Error(`高德天气API错误: ${weatherData.info}`)
       }
       
       // 处理高德天气API响应数据
       const lives = weatherData.lives?.[0]
       if (!lives) {
         throw new Error('天气数据格式错误')
       }
       
       console.log('天气组件: 处理天气数据:', lives)
       
       setWeather({
         temperature: parseInt(lives.temperature),
         description: lives.weather,
         icon: lives.weather, // 高德API返回的是天气描述，不是图标代码
         location: apiLocationName,
         humidity: parseInt(lives.humidity),
         windSpeed: parseFloat((lives.windpower || '').replace('≤', '').replace('级', '')) || 0, // 风力等级转换
         feelsLike: parseInt(lives.temperature), // 高德API基础版没有体感温度，使用实际温度
         pressure: 1013, // 高德API基础版没有气压数据，使用默认值
         visibility: 10, // 高德API基础版没有能见度数据，使用默认值
         uvIndex: 0, // 高德API基础版没有紫外线指数，使用默认值
         windDir: lives.winddirection,
         updateTime: lives.reporttime
       })
    } catch (err) {
      // 如果API失败，使用模拟数据
      console.warn('天气API失败，使用模拟数据:', err)
      
      setWeather({
        temperature: 22,
        description: '晴',
        icon: '100',
        location: locationName,
        humidity: 65,
        windSpeed: 3.2,
        feelsLike: 24,
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        windDir: '东南风',
        updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    } finally {
      setLoading(false)
    }
  }
  
  const getAmapWeatherIcon = (weather: string) => {
     // 高德天气描述映射
     const iconMap: { [key: string]: string } = {
       '晴': '☀️',
       '少云': '🌤️',
       '晴间多云': '⛅',
       '多云': '☁️',
       '阴': '☁️',
       '有风': '💨',
       '平静': '🌤️',
       '微风': '💨',
       '和风': '💨',
       '清风': '💨',
       '强风': '💨',
       '疾风': '💨',
       '大风': '💨',
       '烈风': '💨',
       '风暴': '🌪️',
       '狂爆风': '🌪️',
       '飓风': '🌪️',
       '热带风暴': '🌪️',
       '霾': '🌫️',
       '中度霾': '🌫️',
       '重度霾': '🌫️',
       '严重霾': '🌫️',
       '雾': '🌫️',
       '浓雾': '🌫️',
       '强浓雾': '🌫️',
       '轻雾': '🌫️',
       '大雾': '🌫️',
       '特强浓雾': '🌫️',
       '阵雨': '🌦️',
       '雷阵雨': '⛈️',
       '雷阵雨并伴有冰雹': '🌨️',
       '小雨': '🌦️',
       '中雨': '🌧️',
       '大雨': '🌧️',
       '暴雨': '🌧️',
       '大暴雨': '🌧️',
       '特大暴雨': '🌧️',
       '强阵雨': '🌧️',
       '强雷阵雨': '⛈️',
       '极端降雨': '🌧️',
       '毛毛雨': '🌦️',
       '细雨': '🌦️',
       '小到中雨': '🌦️',
       '中到大雨': '🌧️',
       '大到暴雨': '🌧️',
       '暴雨到大暴雨': '🌧️',
       '大暴雨到特大暴雨': '🌧️',
       '雨': '🌧️',
       '小雪': '🌨️',
       '中雪': '❄️',
       '大雪': '❄️',
       '暴雪': '❄️',
       '雨夹雪': '🌨️',
       '阵雪': '🌨️',
       '阵雨夹雪': '🌨️',
       '冻雨': '🌨️',
       '雪': '❄️',
       '薄雾': '🌫️',
       '扬沙': '💨',
       '浮尘': '💨',
       '沙尘暴': '💨',
       '强沙尘暴': '💨',
       '龙卷风': '🌪️',
       '冰雹': '🌨️',
       '雨雪天气': '🌨️',
       '雨雪': '🌨️'
     }
     
     return iconMap[weather] || '☀️'
   }
   
   const getUVLevel = (uvIndex: number): string => {
     if (uvIndex <= 2) return '低'
     if (uvIndex <= 5) return '中等'
     if (uvIndex <= 7) return '高'
     if (uvIndex <= 10) return '很高'
     return '极高'
   }

  useEffect(() => {
    console.log('天气组件: 组件已加载，开始初始化')
    // 首次加载时尝试获取天气，如果地理位置失败会自动显示权限提示
    fetchWeather()
    // 每30分钟更新一次天气
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  // 点击外部区域关闭详细信息
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false)
      }
    }
    
    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDetails])

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>获取天气...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchWeather}
          className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Loader2 className="h-4 w-4" />
          <span>天气</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={detailsRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        title={`点击查看详细天气信息`}
      >
        {getAmapWeatherIcon(weather.icon)}
        <span className="hidden sm:inline">{weather.temperature}°C</span>
        <span className="hidden md:inline text-xs">{weather.location}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </Button>
      

      
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{weather.location}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">更新时间: {weather.updateTime}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getAmapWeatherIcon(weather.icon)}</span>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weather.temperature}°C</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{weather.description}</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">体感温度:</span>
                <span className="text-gray-900 dark:text-white">{weather.feelsLike}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">湿度:</span>
                <span className="text-gray-900 dark:text-white">{weather.humidity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">风速:</span>
                <span className="text-gray-900 dark:text-white">{weather.windDir} {(weather.windSpeed * 3.6).toFixed(1)}km/h</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">气压</div>
                <div className="font-semibold text-gray-900 dark:text-white">{weather.pressure}hPa</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">能见度</div>
                <div className="font-semibold text-gray-900 dark:text-white">{weather.visibility}km</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">紫外线</div>
                <div className="font-semibold text-gray-900 dark:text-white">{getUVLevel(weather.uvIndex)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWeather}
              className="w-full text-xs"
            >
              刷新天气
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}