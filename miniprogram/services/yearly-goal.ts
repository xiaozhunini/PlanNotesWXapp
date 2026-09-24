// services/yearly-goal.ts
// 年计划服务（对应 yearly_goals 表），通过 API 调用后端
import { request } from '../utils/request'
import { API } from '../api/endpoints'
import { YearlyGoal } from '../models'

export interface YearlyGoalInput {
  title: string
  tagId?: number
  description?: string
  targetYear?: number
  progress?: number
  yearlyStatus?: YearlyGoal['yearlyStatus']
}

/** 年计划列表，可按年份筛选 */
export async function listYearlyGoals(targetYear?: number): Promise<YearlyGoal[]> {
  const query = targetYear ? `?targetYear=${targetYear}` : ''
  return request<YearlyGoal[]>({
    url: `${API.yearlyGoals.list}${query}`,
    method: 'GET',
  })
}

/** 按 ID 获取年计划 */
export async function getYearlyGoal(id: number): Promise<YearlyGoal | null> {
  return request<YearlyGoal>({
    url: API.yearlyGoals.detail(id),
    method: 'GET',
  })
}

/** 新增年计划 */
export async function addYearlyGoal(input: YearlyGoalInput): Promise<YearlyGoal> {
  return request<YearlyGoal>({
    url: API.yearlyGoals.list,
    method: 'POST',
    data: {
      title: input.title.trim(),
      tagId: input.tagId,
      description: input.description || '',
      targetYear: input.targetYear || new Date().getFullYear(),
      progress: input.progress ?? 0,
      yearlyStatus: input.yearlyStatus || 1,
    },
  })
}

/** 更新年计划 */
export async function updateYearlyGoal(
  id: number,
  patch: Partial<Omit<YearlyGoal, 'id' | 'userId' | 'createdAt'>>
): Promise<YearlyGoal | null> {
  return request<YearlyGoal>({
    url: API.yearlyGoals.detail(id),
    method: 'PUT',
    data: patch,
  })
}

/** 删除年计划 */
export async function removeYearlyGoal(id: number): Promise<boolean> {
  await request<void>({
    url: API.yearlyGoals.detail(id),
    method: 'DELETE',
  })
  return true
}
