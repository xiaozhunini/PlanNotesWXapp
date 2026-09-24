// services/daily-schedule.ts
// 日计划/日程服务（对应 daily_schedules 表），通过 API 调用后端
import { request } from '../utils/request'
import { API } from '../api/endpoints'
import { DailySchedule } from '../models'

export interface DailyScheduleInput {
  planDate: string
  startTime: string
  endTime: string
  taskContent: string
  sortOrder?: number
}

/** 某天的日程列表 */
export async function listSchedulesByDate(planDate: string): Promise<DailySchedule[]> {
  return request<DailySchedule[]>({
    url: `${API.dailySchedules.list}?planDate=${planDate}`,
    method: 'GET',
  })
}

/** 新增日程 */
export async function addSchedule(input: DailyScheduleInput): Promise<DailySchedule> {
  return request<DailySchedule>({
    url: API.dailySchedules.list,
    method: 'POST',
    data: {
      planDate: input.planDate,
      startTime: input.startTime,
      endTime: input.endTime,
      taskContent: input.taskContent.trim(),
      sortOrder: input.sortOrder,
    },
  })
}

/** 更新日程 */
export async function updateSchedule(
  id: number,
  patch: Partial<Omit<DailySchedule, 'id' | 'userId' | 'planDate' | 'createdAt'>>
): Promise<DailySchedule | null> {
  return request<DailySchedule>({
    url: API.dailySchedules.detail(id),
    method: 'PUT',
    data: patch,
  })
}

/** 切换完成状态 */
export async function toggleScheduleComplete(
  id: number,
  value?: boolean
): Promise<DailySchedule | null> {
  return request<DailySchedule>({
    url: API.dailySchedules.detail(id),
    method: 'PUT',
    data: { isCompleted: value },
  })
}

/** 删除日程 */
export async function removeSchedule(id: number): Promise<boolean> {
  await request<void>({
    url: API.dailySchedules.detail(id),
    method: 'DELETE',
  })
  return true
}
