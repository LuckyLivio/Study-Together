'use client'

import { useState, useEffect, useRef } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Loader2, ChevronDown, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [showCitySelector, setShowCitySelector] = useState(false)
  const [searchCity, setSearchCity] = useState('')
  const detailsRef = useRef<HTMLDivElement>(null)

  // 常用城市列表
  const popularCities = [
    { name: '北京', lat: 39.9042, lon: 116.4074 },
    { name: '上海', lat: 31.2304, lon: 121.4737 },
    { name: '广州', lat: 23.1291, lon: 113.2644 },
    { name: '深圳', lat: 22.5431, lon: 114.0579 },
    { name: '杭州', lat: 30.2741, lon: 120.1551 },
    { name: '南京', lat: 32.0603, lon: 118.7969 },
    { name: '武汉', lat: 30.5928, lon: 114.3055 },
    { name: '成都', lat: 30.6598, lon: 104.0633 },
    { name: '西安', lat: 34.3416, lon: 108.9398 },
    { name: '重庆', lat: 29.5630, lon: 106.5516 },
    { name: '天津', lat: 39.3434, lon: 117.3616 },
    { name: '苏州', lat: 31.2989, lon: 120.5853 },
    { name: '青岛', lat: 36.0671, lon: 120.3826 },
    { name: '长沙', lat: 28.2282, lon: 112.9388 },
    { name: '大连', lat: 38.9140, lon: 121.6147 },
    { name: '厦门', lat: 24.4798, lon: 118.0819 },
    { name: '无锡', lat: 31.4912, lon: 120.3124 },
    { name: '福州', lat: 26.0745, lon: 119.2965 },
    { name: '济南', lat: 36.6512, lon: 117.1201 },
    { name: '昆明', lat: 25.0389, lon: 102.7183 }
  ]

  const getWeatherIcon = (iconCode: string) => {
    const code = iconCode.toLowerCase()
    if (code.includes('01')) return <Sun className="h-4 w-4 text-yellow-500" />
    if (code.includes('02') || code.includes('03') || code.includes('04')) return <Cloud className="h-4 w-4 text-gray-500" />
    if (code.includes('09') || code.includes('10') || code.includes('11')) return <CloudRain className="h-4 w-4 text-blue-500" />
    if (code.includes('13')) return <CloudSnow className="h-4 w-4 text-blue-300" />
    return <Cloud className="h-4 w-4 text-gray-500" />
  }

  // 通过IP获取位置信息
  const getLocationByIP = async (): Promise<{latitude: number, longitude: number, city: string}> => {
    try {
      console.log('天气组件: 开始IP定位')
      
      // 使用高德IP定位API
      const API_KEY = process.env.NEXT_PUBLIC_AMAP_API_KEY || 'demo_key'
      
      if (API_KEY === 'demo_key') {
        console.log('天气组件: 使用演示模式，返回默认北京位置')
        return {
          latitude: 39.9042,
          longitude: 116.4074,
          city: '北京市'
        }
      }
      
      const ipUrl = `https://restapi.amap.com/v3/ip?key=${API_KEY}`
      console.log('天气组件: 请求IP定位API:', ipUrl)
      
      const response = await fetch(ipUrl)
      if (!response.ok) {
        throw new Error(`IP定位请求失败: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('天气组件: IP定位API响应:', data)
      
      if (data.status !== '1') {
        throw new Error(`IP定位失败: ${data.info}`)
      }
      
      // 解析位置信息 - 计算矩形区域的中心点
      let longitude = 116.4074 // 默认北京经度
      let latitude = 39.9042   // 默认北京纬度
      
      if (data.rectangle) {
        const coords = data.rectangle.split(';')
        if (coords.length === 2) {
          const [leftBottom, rightTop] = coords
          const [leftLng, bottomLat] = leftBottom.split(',').map(parseFloat)
          const [rightLng, topLat] = rightTop.split(',').map(parseFloat)
          
          // 计算矩形中心点
          longitude = (leftLng + rightLng) / 2
          latitude = (bottomLat + topLat) / 2
          
          console.log('天气组件: 矩形区域:', { leftBottom, rightTop })
          console.log('天气组件: 计算中心点:', { longitude, latitude })
        }
      }
      
      const city = data.city || data.province || '未知城市'
      
      console.log('天气组件: IP定位成功:', { latitude, longitude, city })
      
      return {
        latitude,
        longitude,
        city
      }
    } catch (error) {
      console.error('天气组件: IP定位失败:', error)
      // 返回默认北京位置
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        city: '北京市'
      }
    }
  }

  // 根据指定位置获取天气
  const fetchWeatherForLocation = async (latitude: number, longitude: number, locationName: string) => {
    setLoading(true)
    setError(null)

    try {
      const API_KEY = process.env.NEXT_PUBLIC_AMAP_API_KEY || 'demo_key'
      const WEATHER_URL = process.env.NEXT_PUBLIC_AMAP_WEATHER_URL || 'https://restapi.amap.com/v3/weather/weatherInfo'
      const REGEO_URL = process.env.NEXT_PUBLIC_AMAP_REGEO_URL || 'https://restapi.amap.com/v3/geocode/regeo'
      console.log('天气组件: 开始获取指定位置天气数据:', locationName)
      
      // 如果是演示密钥，使用模拟数据
      if (API_KEY === 'demo_key') {
        console.log('天气组件: 使用演示模式，返回模拟数据')
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
      const regeoUrl = `${REGEO_URL}?key=${API_KEY}&location=${longitude},${latitude}`
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
      
      console.log('天气组件: 获取到城市编码:', adcode, '位置名称:', apiLocationName)
      const finalLocationName = apiLocationName
      
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
      
      const liveWeather = weatherData.lives?.[0]
      if (!liveWeather) {
        throw new Error('天气数据格式错误')
      }
      
      console.log('天气组件: 解析天气数据:', liveWeather)
      
      setWeather({
        temperature: parseInt(liveWeather.temperature),
        description: liveWeather.weather,
        icon: liveWeather.weather_id || '100',
        location: finalLocationName,
        humidity: parseInt(liveWeather.humidity),
        windSpeed: parseFloat(liveWeather.windpower) || 0,
        feelsLike: parseInt(liveWeather.temperature),
        pressure: 1013,
        visibility: 10,
        uvIndex: 3,
        windDir: liveWeather.winddirection || '无风',
        updateTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
      
      console.log('天气组件: 天气数据设置完成')
      
    } catch (error) {
      console.error('天气组件: 获取天气失败:', error)
      setError(error instanceof Error ? error.message : '获取天气信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 尝试使用浏览器地理定位API（更准确）
  const tryBrowserGeolocation = (): Promise<{latitude: number, longitude: number, city: string}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          console.log('天气组件: 浏览器定位成功:', { latitude, longitude })
          
          // 使用高德逆地理编码获取城市名称
          try {
            const API_KEY = process.env.NEXT_PUBLIC_AMAP_API_KEY || 'demo_key'
            const geocodeUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${API_KEY}&location=${longitude},${latitude}&radius=1000&extensions=base`
            const response = await fetch(geocodeUrl)
            const data = await response.json()
            
            let city = '未知城市'
            if (data.status === '1' && data.regeocode?.addressComponent) {
              const addr = data.regeocode.addressComponent
              city = addr.city || addr.province || '未知城市'
            }
            
            resolve({ latitude, longitude, city })
          } catch (error) {
            console.warn('天气组件: 逆地理编码失败，使用默认城市名', error)
            resolve({ latitude, longitude, city: '当前位置' })
          }
        },
        (error) => {
          console.warn('天气组件: 浏览器定位失败:', error.message)
          reject(error)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5分钟缓存
        }
      )
    })
  }
  
  // 获取天气数据（使用IP定位）
  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('天气组件: 开始获取天气数据')
      
      let location
      
      // 首先尝试浏览器地理定位（更准确）
      try {
        location = await tryBrowserGeolocation()
        console.log('天气组件: 使用浏览器定位获取到位置:', location)
      } catch (browserError: any) {
         console.log('天气组件: 浏览器定位失败，回退到IP定位:', browserError.message)
        // 回退到IP定位
        location = await getLocationByIP()
        console.log('天气组件: 使用IP定位获取到位置:', location)
      }
      
      // 使用定位结果获取天气
      await fetchWeatherForLocation(location.latitude, location.longitude, location.city)
      
      console.log('天气组件: 天气获取完成')
      
    } catch (error: any) {
      console.error('天气组件: 获取天气失败:', error)
      setError('获取天气信息失败，请稍后重试')
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  // 过滤城市列表
  const filteredCities = popularCities.filter(city => 
    city.name.toLowerCase().includes(searchCity.toLowerCase())
  )

  // 手动选择城市
  const selectCity = async (city: {name: string, lat: number, lon: number}) => {
    setShowCitySelector(false)
    setSearchCity('')
    
    try {
      console.log('用户手动选择城市:', city.name)
      await fetchWeatherForLocation(city.lat, city.lon, city.name)
    } catch (error) {
      console.error('获取选定城市天气失败:', error)
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
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          title="天气获取失败，点击查看详细信息"
        >
          <Loader2 className="h-4 w-4" />
          <span>天气获取失败</span>
        </Button>
        
        {showDetails && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4 w-96 z-50">
            <div className="mb-3">
              <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">天气获取失败</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {error || '无法获取天气信息'}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                size="sm"
                onClick={fetchWeather}
                className="w-full"
              >
                重新获取天气
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCitySelector(true)}
                className="w-full"
              >
                手动选择城市
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={detailsRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
        title="点击查看详细天气信息"
      >
        {getAmapWeatherIcon(weather.icon)}
        <span className="hidden sm:inline">{weather.temperature}°C</span>
        <span className="hidden md:inline text-xs">{weather.location}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </Button>
      
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{weather.location}</h3>
            </div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWeather}
                disabled={loading}
                className="flex-1 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    刷新中
                  </>
                ) : (
                  '刷新天气'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCitySelector(!showCitySelector)}
                disabled={loading}
                className="flex-1 text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <MapPin className="h-3 w-3 mr-1" />
                {showCitySelector ? '关闭城市选择' : '选择城市'}
              </Button>
            </div>
             
            {/* 城市选择器 */}
            {showCitySelector && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="搜索城市..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="pl-7 text-xs h-8"
                    />
                  </div>
                </div>
                
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1">
                    {filteredCities.map((city) => (
                      <Button
                        key={city.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => selectCity(city)}
                        disabled={loading}
                        className="text-xs h-7 justify-start hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                 
                  {filteredCities.length === 0 && searchCity && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        未找到匹配的城市
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}