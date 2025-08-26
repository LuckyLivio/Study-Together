'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Trash2 } from 'lucide-react';

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  weeks: number[];
}

interface AddCourseDialogProps {
  onCourseAdded: () => void;
  onClose: () => void;
  editingCourse?: {
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
  } | null;
}

export function AddCourseDialog({ onCourseAdded, onClose, editingCourse }: AddCourseDialogProps) {
  const [formData, setFormData] = useState({
    name: editingCourse?.name || '',
    code: editingCourse?.code || '',
    instructor: editingCourse?.instructor || '',
    location: editingCourse?.location || '',
    description: editingCourse?.description || '',
    credits: editingCourse?.credits || 0,
    color: editingCourse?.color || '#3B82F6'
  });

  const [schedules, setSchedules] = useState<Schedule[]>(
    editingCourse?.schedules.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      weeks: s.weeks ? JSON.parse(s.weeks) : []
    })) || [{
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:40',
      weeks: []
    }]
  );

  const [weeksInput, setWeeksInput] = useState<string[]>(
    schedules.map(s => s.weeks.join(','))
  );

  const [submitting, setSubmitting] = useState(false);

  const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // 添加时间段
  const addSchedule = () => {
    setSchedules([...schedules, {
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:40',
      weeks: []
    }]);
    setWeeksInput([...weeksInput, '']);
  };

  // 删除时间段
  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
    setWeeksInput(weeksInput.filter((_, i) => i !== index));
  };

  // 更新时间段
  const updateSchedule = (index: number, field: keyof Schedule, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  // 解析周次输入
  const parseWeeks = (weeksStr: string): number[] => {
    if (!weeksStr.trim()) return [];
    
    const weeks: number[] = [];
    const parts = weeksStr.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= 20 && !weeks.includes(i)) {
              weeks.push(i);
            }
          }
        }
      } else {
        const week = parseInt(trimmed);
        if (!isNaN(week) && week >= 1 && week <= 20 && !weeks.includes(week)) {
          weeks.push(week);
        }
      }
    }
    
    return weeks.sort((a, b) => a - b);
  };

  // 更新周次输入
  const updateWeeksInput = (index: number, value: string) => {
    const newWeeksInput = [...weeksInput];
    newWeeksInput[index] = value;
    setWeeksInput(newWeeksInput);
    
    const weeks = parseWeeks(value);
    updateSchedule(index, 'weeks', weeks);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      alert('请输入课程名称');
      return;
    }

    if (schedules.length === 0) {
      alert('请至少添加一个上课时间');
      return;
    }

    // 验证时间段
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      if (!schedule.startTime || !schedule.endTime) {
        alert(`请完整填写第${i + 1}个时间段`);
        return;
      }
      
      if (schedule.startTime >= schedule.endTime) {
        alert(`第${i + 1}个时间段的结束时间必须晚于开始时间`);
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const courseData = {
        ...formData,
        credits: formData.credits || 0,
        schedules: schedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          weeks: JSON.stringify(schedule.weeks)
        }))
      };

      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存课程失败');
      }
      
      onCourseAdded();
      onClose();
      
    } catch (error) {
      console.error('保存课程失败:', error);
      alert(error instanceof Error ? error.message : '保存课程失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {editingCourse ? '编辑课程' : '添加课程'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">课程名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：高等数学"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="code">课程代码</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="例如：MATH101"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="instructor">授课教师</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="例如：张教授"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="location">上课地点</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="例如：A101"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="credits">学分</Label>
            <Input
              id="credits"
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={formData.credits}
              onChange={(e) => setFormData(prev => ({ ...prev, credits: parseFloat(e.target.value) || 0 }))}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="color">课程颜色</Label>
            <div className="mt-2 space-y-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10"
              />
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 课程描述 */}
        <div>
          <Label htmlFor="description">课程描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="课程简介、要求等..."
            rows={3}
            className="mt-2"
          />
        </div>

        {/* 上课时间 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-medium">上课时间 *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSchedule}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加时间段
            </Button>
          </div>
          
          <div className="space-y-4">
            {schedules.map((schedule, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">时间段 {index + 1}</h4>
                  {schedules.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSchedule(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>星期</Label>
                    <select
                      value={schedule.dayOfWeek}
                      onChange={(e) => updateSchedule(index, 'dayOfWeek', parseInt(e.target.value))}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {dayNames.slice(1).map((day, dayIndex) => (
                        <option key={dayIndex + 1} value={dayIndex + 1}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>开始时间</Label>
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>结束时间</Label>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>周次</Label>
                    <Input
                      value={weeksInput[index] || ''}
                      onChange={(e) => updateWeeksInput(index, e.target.value)}
                      placeholder="例如：1-16 或 1,3,5-8"
                      className="mt-2"
                    />
                  </div>
                </div>
                
                {/* 周次预览 */}
                {schedule.weeks.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600">周次预览：</Label>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {schedule.weeks.map(week => (
                        <Badge key={week} variant="outline" className="text-xs">
                          第{week}周
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? '更新课程' : '添加课程'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}