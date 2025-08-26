'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Share2, Lock, Trash2, Edit, Save, X } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
}

interface CourseEvaluation {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  difficulty: number;
  workload: number;
  comment?: string;
  isRecommended: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  course: Course;
  user: {
    id: string;
    username: string;
  };
}

interface CourseEvaluationsProps {
  courses: Course[];
  onEvaluationChange?: () => void;
}

export function CourseEvaluations({ courses, onEvaluationChange }: CourseEvaluationsProps) {
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [editingEvaluation, setEditingEvaluation] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    rating: 5,
    difficulty: 3,
    workload: 3,
    comment: '',
    isRecommended: true,
    isShared: false
  });

  // 获取评价数据
  const fetchEvaluations = async (courseId?: string) => {
    try {
      setLoading(true);
      const url = courseId ? `/api/courses/${courseId}/evaluations` : '/api/courses/evaluations';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('获取评价失败');
      }
      
      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error('获取评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取所有评价
  useEffect(() => {
    fetchEvaluations();
  }, []);

  // 当选择课程时获取该课程的评价
  useEffect(() => {
    if (selectedCourse) {
      fetchEvaluations(selectedCourse);
    } else {
      fetchEvaluations();
    }
  }, [selectedCourse]);

  // 提交评价
  const handleSubmitEvaluation = async () => {
    if (!selectedCourse) {
      alert('请选择要评价的课程');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/courses/${selectedCourse}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交评价失败');
      }
      
      // 重置表单
      setFormData({
        rating: 5,
        difficulty: 3,
        workload: 3,
        comment: '',
        isRecommended: true,
        isShared: false
      });
      setShowForm(false);
      
      // 刷新评价列表
      fetchEvaluations(selectedCourse);
      onEvaluationChange?.();
      
    } catch (error) {
      console.error('提交评价失败:', error);
      alert(error instanceof Error ? error.message : '提交评价失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评价
  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('确定要删除这条评价吗？')) {
      return;
    }

    try {
      const evaluation = evaluations.find(e => e.id === evaluationId);
      if (!evaluation) return;
      
      const response = await fetch(`/api/courses/${evaluation.courseId}/evaluations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ evaluationId })
      });
      
      if (!response.ok) {
        throw new Error('删除评价失败');
      }
      
      // 刷新评价列表
      fetchEvaluations(selectedCourse || undefined);
      onEvaluationChange?.();
      
    } catch (error) {
      console.error('删除评价失败:', error);
      alert('删除评价失败，请重试');
    }
  };

  // 渲染星级评分
  const renderStars = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  // 渲染难度/工作量指示器
  const renderLevelIndicator = (level: number, maxLevel: number = 5, color: string = 'blue') => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxLevel }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < level 
                ? `bg-${color}-500` 
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 课程选择和添加评价 */}
      <Card>
        <CardHeader>
          <CardTitle>课程评价</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 课程选择 */}
          <div>
            <Label htmlFor="course-select">选择课程</Label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部课程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} {course.code ? `(${course.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 添加评价按钮 */}
          {selectedCourse && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    取消评价
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    添加评价
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评价表单 */}
      {showForm && selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>评价课程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 总体评分 */}
            <div>
              <Label>总体评分</Label>
              <div className="mt-2">
                {renderStars(formData.rating, (rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>

            {/* 难度评估 */}
            <div>
              <Label>课程难度</Label>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-gray-600">简单</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded-full cursor-pointer transition-colors ${
                        level <= formData.difficulty 
                          ? 'bg-red-500' 
                          : 'bg-gray-200 hover:bg-red-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">困难</span>
              </div>
            </div>

            {/* 工作量评估 */}
            <div>
              <Label>工作量</Label>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-gray-600">轻松</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded-full cursor-pointer transition-colors ${
                        level <= formData.workload 
                          ? 'bg-orange-500' 
                          : 'bg-gray-200 hover:bg-orange-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, workload: level }))}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">繁重</span>
              </div>
            </div>

            {/* 评论 */}
            <div>
              <Label htmlFor="comment">评论 (可选)</Label>
              <Textarea
                id="comment"
                placeholder="分享您对这门课程的看法..."
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className="mt-2"
              />
            </div>

            {/* 推荐和分享选项 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecommended}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecommended: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm">推荐这门课程</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isShared}
                  onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm">与情侣分享此评价</span>
              </label>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button onClick={handleSubmitEvaluation} disabled={submitting}>
                {submitting ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-pulse" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    提交评价
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 评价列表 */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              加载评价中...
            </CardContent>
          </Card>
        ) : evaluations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {selectedCourse ? '该课程暂无评价' : '暂无课程评价'}
            </CardContent>
          </Card>
        ) : (
          evaluations.map(evaluation => (
            <Card key={evaluation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* 课程信息 */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {evaluation.course.name}
                      </h3>
                      {evaluation.course.code && (
                        <Badge variant="outline">{evaluation.course.code}</Badge>
                      )}
                      {evaluation.isRecommended && (
                        <Badge className="bg-green-100 text-green-800">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          推荐
                        </Badge>
                      )}
                      {evaluation.isShared ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Share2 className="w-3 h-3 mr-1" />
                          已分享
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="w-3 h-3 mr-1" />
                          私有
                        </Badge>
                      )}
                    </div>

                    {/* 评分信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">总体评分</Label>
                        <div className="mt-1">
                          {renderStars(evaluation.rating)}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">课程难度</Label>
                        <div className="mt-1 flex items-center gap-2">
                          {renderLevelIndicator(evaluation.difficulty, 5, 'red')}
                          <span className="text-sm text-gray-500">
                            {evaluation.difficulty}/5
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-600">工作量</Label>
                        <div className="mt-1 flex items-center gap-2">
                          {renderLevelIndicator(evaluation.workload, 5, 'orange')}
                          <span className="text-sm text-gray-500">
                            {evaluation.workload}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 评论 */}
                    {evaluation.comment && (
                      <div>
                        <Label className="text-sm text-gray-600">评论</Label>
                        <p className="mt-1 text-gray-900">{evaluation.comment}</p>
                      </div>
                    )}

                    {/* 时间信息 */}
                    <div className="text-sm text-gray-500">
                      评价时间：{new Date(evaluation.createdAt).toLocaleString('zh-CN')}
                      {evaluation.updatedAt !== evaluation.createdAt && (
                        <span className="ml-2">
                          (更新于 {new Date(evaluation.updatedAt).toLocaleString('zh-CN')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvaluation(evaluation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}