import { create } from 'zustand'
import { User, StudyTask, CountdownTarget, Course } from '@/types'

// 用户状态
interface UserState {
  user: User | null
  partner: User | null
  setUser: (user: User | null) => void
  setPartner: (partner: User | null) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  partner: null,
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
}))

// 学习任务状态
interface TaskState {
  tasks: StudyTask[]
  partnerTasks: StudyTask[]
  setTasks: (tasks: StudyTask[]) => void
  setPartnerTasks: (tasks: StudyTask[]) => void
  addTask: (task: StudyTask) => void
  updateTask: (id: string, updates: Partial<StudyTask>) => void
  deleteTask: (id: string) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  partnerTasks: [],
  setTasks: (tasks) => set({ tasks }),
  setPartnerTasks: (partnerTasks) => set({ partnerTasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => task.id === id ? { ...task, ...updates } : task)
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
}))

// 倒计时状态
interface CountdownState {
  targets: CountdownTarget[]
  partnerTargets: CountdownTarget[]
  setTargets: (targets: CountdownTarget[]) => void
  setPartnerTargets: (targets: CountdownTarget[]) => void
  addTarget: (target: CountdownTarget) => void
  updateTarget: (id: string, updates: Partial<CountdownTarget>) => void
  deleteTarget: (id: string) => void
}

export const useCountdownStore = create<CountdownState>((set) => ({
  targets: [],
  partnerTargets: [],
  setTargets: (targets) => set({ targets }),
  setPartnerTargets: (partnerTargets) => set({ partnerTargets }),
  addTarget: (target) => set((state) => ({ targets: [...state.targets, target] })),
  updateTarget: (id, updates) => set((state) => ({
    targets: state.targets.map(target => target.id === id ? { ...target, ...updates } : target)
  })),
  deleteTarget: (id) => set((state) => ({
    targets: state.targets.filter(target => target.id !== id)
  })),
}))

// 课程表状态
interface ScheduleState {
  courses: Course[]
  partnerCourses: Course[]
  setCourses: (courses: Course[]) => void
  setPartnerCourses: (courses: Course[]) => void
  addCourse: (course: Course) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  deleteCourse: (id: string) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  courses: [],
  partnerCourses: [],
  setCourses: (courses) => set({ courses }),
  setPartnerCourses: (partnerCourses) => set({ partnerCourses }),
  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  updateCourse: (id, updates) => set((state) => ({
    courses: state.courses.map(course => course.id === id ? { ...course, ...updates } : course)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(course => course.id !== id)
  })),
}))