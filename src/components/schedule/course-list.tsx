'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, MapPin, User, Clock, Star, Search } from 'lucide-react';

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

interface CourseListProps {
  courses: Course[];
  onCourseDeleted: () => void;
  onCourseEdit?: (course: Course) => void;
}

export function CourseList({ courses, onCourseDeleted, onCourseEdit }: CourseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'credits' | 'rating'>('name');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 过滤和排序课程
  const filteredAndSortedCourses = courses
    .filter(course => {
      // 搜索过滤
      const matchesSearch = !searchTerm || 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 星期过滤
      const matchesDay = filterDay === 'all' || 
        course.schedules.some(schedule => schedule.dayOfWeek.toString() === filterDay);
      
      return matchesSearch && matchesDay;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return (a.code || '').localeCompare(b.code || '');
        case 'credits':
          return (b.credits || 0) - (a.credits || 0);
        case 'rating':
          const aRating = a.evaluations.length > 0 ? 
            a.evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / a.evaluations.length : 0;
          const bRating = b.evaluations.length > 0 ? 
            b.evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / b.evaluations.length : 0;
          return bRating - aRating;
        default:
          return 0;
      }
    });

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

  // 获取课程的平均评分
  const getCourseRating = (course: Course) => {
    if (course.evaluations.length === 0) return null;
    return course.evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / course.evaluations.length;
  };

  // 格式化上课时间
  const formatSchedule = (schedules: Course['schedules']) => {
    return schedules.map(schedule => {
      const weeks = schedule.weeks ? JSON.parse(schedule.weeks) : [];
      const weeksText = weeks.length > 0 ? `第${weeks.join(',')}周` : '';
      return `${dayNames[schedule.dayOfWeek]} ${schedule.startTime}-${schedule.endTime} ${weeksText}`.trim();
    }).join('; ');
  };

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            课程搜索与筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索课程名称、代码或教师..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">按名称</option>
                <option value="code">按代码</option>
                <option value="credits">按学分</option>
                <option value="rating">按评分</option>
              </select>
              
              <select 
                value={filterDay} 
                onChange={(e) => setFilterDay(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                {dayNames.slice(1).map((day, index) => (
                  <option key={index + 1} value={(index + 1).toString()}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课程列表 */}
      <div className="space-y-4">
        {filteredAndSortedCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {courses.length === 0 ? '暂无课程，请添加课程' : '没有找到匹配的课程'}
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedCourses.map(course => {
            const rating = getCourseRating(course);
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* 课程标题 */}
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: course.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {course.name}
                        </h3>
                        {course.code && (
                          <Badge variant="outline">{course.code}</Badge>
                        )}
                        {course.credits && (
                          <Badge variant="secondary">{course.credits}学分</Badge>
                        )}
                      </div>

                      {/* 课程信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {course.instructor && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>教师：{course.instructor}</span>
                          </div>
                        )}
                        {course.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>地点：{course.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 md:col-span-2">
                          <Clock className="w-4 h-4" />
                          <span>时间：{formatSchedule(course.schedules)}</span>
                        </div>
                      </div>

                      {/* 课程描述 */}
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/* 评价信息 */}
                      <div className="flex items-center gap-4">
                        {rating !== null && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {course._count.evaluations > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {course._count.evaluations} 条评价
                          </Badge>
                        )}
                        {course.evaluations.some(evaluation => evaluation.isRecommended) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            推荐
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2 ml-4">
                      {onCourseEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCourseEdit(course)}
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id)}
                        disabled={deletingCourse === course.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingCourse === course.id ? '删除中...' : '删除'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 统计信息 */}
      {courses.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                共 {courses.length} 门课程，显示 {filteredAndSortedCourses.length} 门
              </span>
              <span>
                总学分：{courses.reduce((sum, course) => sum + (course.credits || 0), 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}