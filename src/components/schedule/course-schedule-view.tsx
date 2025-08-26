'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, MapPin, User, Clock } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  location?: string;
  description?: string;
  credits?: number;
  color: string;
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weeks: string;
  }>;
  evaluations: Array<{
    id: string;
    rating: number;
    difficulty: number;
    workload: number;
    comment?: string;
    isRecommended: boolean;
    isShared: boolean;
  }>;
  _count: {
    evaluations: number;
  };
}

interface CourseScheduleViewProps {
  courses: Course[];
  onCourseDeleted: () => void;
}

export function CourseScheduleView({ courses, onCourseDeleted }: CourseScheduleViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // 将时间转换为分钟数
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 获取时间段的网格位置
  const getTimeSlotPosition = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const baseMinutes = timeToMinutes('08:00');
    
    const startRow = Math.floor((startMinutes - baseMinutes) / 30) + 2; // +2 for header
    const duration = endMinutes - startMinutes;
    const rowSpan = Math.ceil(duration / 30);
    
    return { startRow, rowSpan };
  };

  // 按星期几组织课程
  const organizeByDay = () => {
    const daySchedules: Record<number, Array<{ course: Course; schedule: any }>> = {};
    
    for (let day = 1; day <= 7; day++) {
      daySchedules[day] = [];
    }
    
    courses.forEach(course => {
      course.schedules.forEach(schedule => {
        daySchedules[schedule.dayOfWeek].push({ course, schedule });
      });
    });
    
    return daySchedules;
  };

  const daySchedules = organizeByDay();

  // 删除课程
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除这门课程吗？此操作不可撤销。')) {
      return;
    }

    try {
      setDeletingCourse(courseId);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除课程失败');
      }

      onCourseDeleted();
    } catch (error) {
      console.error('删除课程失败:', error);
      alert('删除课程失败，请重试');
    } finally {
      setDeletingCourse(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 课程表网格视图 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            周课程表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-1 min-w-[800px]">
              {/* 表头 */}
              <div className="p-2 font-semibold text-center bg-gray-50 border rounded">时间</div>
              {dayNames.slice(1).map((day, index) => (
                <div key={index} className="p-2 font-semibold text-center bg-gray-50 border rounded">
                  {day}
                </div>
              ))}
              
              {/* 时间槽 */}
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className="contents">
                  <div className="p-2 text-sm text-gray-600 bg-gray-50 border rounded text-center">
                    {time}
                  </div>
                  
                  {/* 每天的课程 */}
                  {[1, 2, 3, 4, 5, 6, 7].map(day => {
                    const dayClasses = daySchedules[day] || [];
                    const currentTimeMinutes = timeToMinutes(time);
                    
                    // 查找在当前时间段的课程
                    const currentClass = dayClasses.find(({ schedule }) => {
                      const startMinutes = timeToMinutes(schedule.startTime);
                      const endMinutes = timeToMinutes(schedule.endTime);
                      return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
                    });
                    
                    if (currentClass) {
                      const { course, schedule } = currentClass;
                      const { startRow, rowSpan } = getTimeSlotPosition(schedule.startTime, schedule.endTime);
                      
                      // 只在开始时间显示课程卡片
                      if (currentTimeMinutes === timeToMinutes(schedule.startTime)) {
                        return (
                          <div
                            key={`${day}-${timeIndex}`}
                            className="p-2 border rounded cursor-pointer hover:shadow-md transition-shadow"
                            style={{ 
                              backgroundColor: course.color + '20',
                              borderColor: course.color,
                              gridRow: `span ${rowSpan}`
                            }}
                            onClick={() => setSelectedCourse(course)}
                          >
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {course.name}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            {course.location && (
                              <div className="text-xs text-gray-500 truncate">
                                {course.location}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        // 课程持续时间内的其他时间段不显示
                        return null;
                      }
                    }
                    
                    return (
                      <div key={`${day}-${timeIndex}`} className="p-2 border border-gray-100 min-h-[60px]">
                        {/* 空时间段 */}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课程详情侧边栏 */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedCourse.color }}
                />
                {selectedCourse.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCourse(selectedCourse.id)}
                  disabled={deletingCourse === selectedCourse.id}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingCourse === selectedCourse.id ? '删除中...' : '删除'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCourse(null)}
                >
                  关闭
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              {selectedCourse.code && (
                <div>
                  <label className="text-sm font-medium text-gray-600">课程代码</label>
                  <p className="text-sm text-gray-900">{selectedCourse.code}</p>
                </div>
              )}
              {selectedCourse.instructor && (
                <div>
                  <label className="text-sm font-medium text-gray-600">授课教师</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedCourse.instructor}
                  </p>
                </div>
              )}
              {selectedCourse.location && (
                <div>
                  <label className="text-sm font-medium text-gray-600">上课地点</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedCourse.location}
                  </p>
                </div>
              )}
              {selectedCourse.credits && (
                <div>
                  <label className="text-sm font-medium text-gray-600">学分</label>
                  <p className="text-sm text-gray-900">{selectedCourse.credits}</p>
                </div>
              )}
            </div>

            {/* 课程描述 */}
            {selectedCourse.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">课程描述</label>
                <p className="text-sm text-gray-900 mt-1">{selectedCourse.description}</p>
              </div>
            )}

            {/* 上课时间 */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">上课时间</label>
              <div className="space-y-2">
                {selectedCourse.schedules.map((schedule, index) => {
                  const weeks = schedule.weeks ? JSON.parse(schedule.weeks) : [];
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Badge variant="outline">
                        {dayNames[schedule.dayOfWeek]}
                      </Badge>
                      <span className="text-sm">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                      {weeks.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          第{weeks.join(',')}周
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 评价信息 */}
            {selectedCourse._count.evaluations > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">课程评价</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    已评价
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {selectedCourse._count.evaluations} 条评价
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}