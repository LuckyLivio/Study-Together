'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Users, FileSpreadsheet, Star } from 'lucide-react';
import { CourseScheduleView } from '@/components/schedule/course-schedule-view';
import { CourseList } from '@/components/schedule/course-list';
import { FreeTimeComparison } from '@/components/schedule/free-time-comparison';
import { CourseImport } from '@/components/schedule/course-import';
import { CourseEvaluations } from '@/components/schedule/course-evaluations';
import { AddCourseDialog } from '@/components/schedule/add-course-dialog';

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

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      
      if (!response.ok) {
        throw new Error('获取课程列表失败');
      }
      
      const data = await response.json();
      setCourses(data.courses || []);
      setError(null);
    } catch (err) {
      console.error('获取课程列表失败:', err);
      setError(err instanceof Error ? err.message : '获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 处理课程添加成功
  const handleCourseAdded = () => {
    setShowAddDialog(false);
    fetchCourses();
  };

  // 处理课程删除
  const handleCourseDeleted = () => {
    fetchCourses();
  };

  // 处理课程导入成功
  const handleImportSuccess = () => {
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 pt-24">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载课程表...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 pt-24">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCourses} variant="outline">
                重新加载
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pt-24">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">课程表管理</h1>
          <p className="text-gray-600 mt-1">
            管理你的课程安排，查看空闲时间，分享课程评价
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加课程
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">总课程数</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">本周课时</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((total, course) => total + course.schedules.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">已评价课程</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(course => course._count.evaluations > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">总学分</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((total, course) => total + (course.credits || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            课程表
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            课程列表
          </TabsTrigger>
          <TabsTrigger value="free-time" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            空闲时间
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            导入课程
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            课程评价
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <CourseScheduleView courses={courses} onCourseDeleted={handleCourseDeleted} />
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <CourseList courses={courses} onCourseDeleted={handleCourseDeleted} />
        </TabsContent>

        <TabsContent value="free-time" className="space-y-4">
          <FreeTimeComparison />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <CourseImport 
            onImportSuccess={handleImportSuccess}
            onClose={() => {}}
          />
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <CourseEvaluations courses={courses} />
        </TabsContent>
      </Tabs>

      {/* 添加课程对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AddCourseDialog
              onClose={() => setShowAddDialog(false)}
              onCourseAdded={handleCourseAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
}