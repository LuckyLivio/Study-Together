'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Users, Calendar } from 'lucide-react';

interface FreeTimeSlot {
  id: string;
  coupleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

interface DayFreeTime {
  dayName: string;
  freeTimeSlots: Array<{
    startTime: string;
    endTime: string;
    duration: number;
  }>;
  totalFreeTime: number;
}

interface WeeklyFreeTime {
  [key: string]: DayFreeTime;
}

interface FreeTimeComparisonProps {
  coupleId?: string;
}

export function FreeTimeComparison({ coupleId }: FreeTimeComparisonProps) {
  const [freeTimeData, setFreeTimeData] = useState<WeeklyFreeTime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 获取空闲时间数据
  const fetchFreeTime = async () => {
    if (!coupleId) {
      setError('请先建立情侣关系');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/courses/free-time');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取空闲时间失败');
      }
      
      const data = await response.json();
      setFreeTimeData(data.weeklyFreeTime);
      setLastUpdated(new Date().toLocaleString('zh-CN'));
    } catch (error) {
      console.error('获取空闲时间失败:', error);
      setError(error instanceof Error ? error.message : '获取空闲时间失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时自动获取数据
  useEffect(() => {
    if (coupleId) {
      fetchFreeTime();
    }
  }, [coupleId]);

  // 格式化时长
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}小时${mins}分钟`;
    } else if (hours > 0) {
      return `${hours}小时`;
    } else {
      return `${mins}分钟`;
    }
  };

  // 计算总空闲时间
  const getTotalWeeklyFreeTime = (): number => {
    if (!freeTimeData) return 0;
    return Object.values(freeTimeData).reduce((total, day) => total + day.totalFreeTime, 0);
  };

  // 获取最长连续空闲时间
  const getLongestFreeTime = (): { day: string; duration: number; timeSlot: string } | null => {
    if (!freeTimeData) return null;
    
    let longest = { day: '', duration: 0, timeSlot: '' };
    
    Object.entries(freeTimeData).forEach(([dayKey, dayData]) => {
      dayData.freeTimeSlots.forEach(slot => {
        if (slot.duration > longest.duration) {
          longest = {
            day: dayData.dayName,
            duration: slot.duration,
            timeSlot: `${slot.startTime} - ${slot.endTime}`
          };
        }
      });
    });
    
    return longest.duration > 0 ? longest : null;
  };

  if (!coupleId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>请先建立情侣关系才能查看共同空闲时间</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新按钮 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              共同空闲时间
            </CardTitle>
            <Button
              onClick={fetchFreeTime}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '计算中...' : '重新计算'}
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              最后更新：{lastUpdated}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-gray-600">正在计算共同空闲时间...</p>
          </CardContent>
        </Card>
      )}

      {/* 空闲时间数据 */}
      {!loading && freeTimeData && (
        <>
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(getTotalWeeklyFreeTime())}
                </div>
                <div className="text-sm text-gray-600">每周总空闲时间</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {Object.values(freeTimeData).filter(day => day.totalFreeTime > 0).length}
                </div>
                <div className="text-sm text-gray-600">有空闲的天数</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-lg font-bold text-gray-900">
                  {(() => {
                    const longest = getLongestFreeTime();
                    return longest ? formatDuration(longest.duration) : '无';
                  })()}
                </div>
                <div className="text-sm text-gray-600">最长连续空闲</div>
              </CardContent>
            </Card>
          </div>

          {/* 每日空闲时间详情 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dayNames.map((dayName, index) => {
              const dayKey = `day${index + 1}`;
              const dayData = freeTimeData[dayKey];
              
              if (!dayData) return null;
              
              return (
                <Card key={dayName}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{dayName}</span>
                      <Badge 
                        variant={dayData.totalFreeTime > 0 ? "default" : "secondary"}
                        className={dayData.totalFreeTime > 0 ? "bg-green-100 text-green-800" : ""}
                      >
                        {dayData.totalFreeTime > 0 ? formatDuration(dayData.totalFreeTime) : '无空闲'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayData.freeTimeSlots.length > 0 ? (
                      <div className="space-y-2">
                        {dayData.freeTimeSlots.map((slot, slotIndex) => (
                          <div 
                            key={slotIndex}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              {formatDuration(slot.duration)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">这天没有共同空闲时间</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 最佳约会时间推荐 */}
          {(() => {
            const longest = getLongestFreeTime();
            return longest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Users className="w-5 h-5" />
                    推荐约会时间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <div className="font-semibold text-purple-900">
                        {longest.day} {longest.timeSlot}
                      </div>
                      <div className="text-sm text-purple-700">
                        连续 {formatDuration(longest.duration)} 的空闲时间
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      最佳时段
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* 无数据状态 */}
      {!loading && !error && !freeTimeData && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无空闲时间数据</p>
            <p className="text-sm mt-2">请先添加课程表，然后点击"重新计算"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}