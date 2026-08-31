// services/daily-schedule.ts
// 日计划/日程服务（对应 daily_schedules 表），当前为本地存储实现
import { read, write, nextId } from '../utils/storage'
import { ensureUser } from './user'
import { DailySchedule } from '../models'

const KEY = 'daily_schedules'

export interface DailyScheduleInput {
  planDate: string          // 'YYYY-MM-DD'
  startTime: string         // 'HH:mm'，如 07:20
  endTime: string           // 'HH:mm'，如 08:20
  taskContent: string       // 事项内容，如 "起床"、"背单词"
  sortOrder?: number
}

/** 某天的日程列表（按排序权重、开始时间排序） */
export async function listSchedulesByDate(planDate: string): Promise<DailySchedule[]> {
  const userId = (await ensureUser()).id
  return read<DailySchedule[]>(KEY, [])
    .filter(s => s.userId === userId && s.planDate === planDate)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime))
}

/** 新增日程（排序权重默认排在当天最后） */
export async function addSchedule(input: DailyScheduleInput): Promise<DailySchedule> {
  const user = await ensureUser()
  const schedules = read<DailySchedule[]>(KEY, [])
  const sameDay = schedules.filter(s => s.userId === user.id && s.planDate === input.planDate)
  const maxSort = sameDay.reduce((max, s) => Math.max(max, s.sortOrder), 0)
  const item: DailySchedule = {
    id: nextId(KEY),
    userId: user.id,
    planDate: input.planDate,
    startTime: input.startTime,
    endTime: input.endTime,
    taskContent: input.taskContent.trim(),
    isCompleted: false,
    selfScore: undefined,
    sortOrder: input.sortOrder ?? maxSort + 1,
    createdAt: Date.now(),
  }
  schedules.unshift(item)
  write(KEY, schedules)
  return item
}

/** 更新日程（时间/内容/完成状态/评分/排序） */
export async function updateSchedule(
  id: number,
  patch: Partial<Omit<DailySchedule, 'id' | 'userId' | 'planDate' | 'createdAt'>>
): Promise<DailySchedule | null> {
  const schedules = read<DailySchedule[]>(KEY, [])
  const index = schedules.findIndex(s => s.id === id)
  if (index === -1) return null
  schedules[index] = { ...schedules[index], ...patch }
  write(KEY, schedules)
  return schedules[index]
}

/** 切换完成状态（可显式指定，不传则取反） */
export async function toggleScheduleComplete(
  id: number,
  value?: boolean
): Promise<DailySchedule | null> {
  const schedules = read<DailySchedule[]>(KEY, [])
  const index = schedules.findIndex(s => s.id === id)
  if (index === -1) return null
  schedules[index] = {
    ...schedules[index],
    isCompleted: value ?? !schedules[index].isCompleted,
  }
  write(KEY, schedules)
  return schedules[index]
}

/** 删除日程 */
export async function removeSchedule(id: number): Promise<boolean> {
  const schedules = read<DailySchedule[]>(KEY, [])
  const rest = schedules.filter(s => s.id !== id)
  write(KEY, rest)
  return rest.length !== schedules.length
}
