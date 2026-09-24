// services/goal-tag.ts
// 标签服务（对应 goal_tag 表），通过 API 调用后端
import { request } from '../utils/request'
import { API } from '../api/endpoints'
import { GoalTag } from '../models'

export interface GoalTagInput {
  name: string
  icon?: string
  color?: string
  sortOrder?: number
}

/** 标签列表（系统通用 + 当前用户自建） */
export async function listGoalTags(): Promise<GoalTag[]> {
  return request<GoalTag[]>({
    url: API.goalTags.list,
    method: 'GET',
  })
}

/** 按 ID 获取标签 */
export async function getGoalTag(id: number): Promise<GoalTag | null> {
  return request<GoalTag>({
    url: API.goalTags.detail(id),
    method: 'GET',
  })
}

/** 新增用户标签 */
export async function addGoalTag(input: GoalTagInput): Promise<GoalTag> {
  return request<GoalTag>({
    url: API.goalTags.list,
    method: 'POST',
    data: {
      name: input.name.trim(),
      icon: input.icon || '',
      color: input.color || '',
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

/** 更新标签 */
export async function updateGoalTag(
  id: number,
  patch: Partial<Omit<GoalTag, 'id' | 'userId' | 'createdAt'>>
): Promise<GoalTag | null> {
  return request<GoalTag>({
    url: API.goalTags.detail(id),
    method: 'PUT',
    data: patch,
  })
}

/** 删除标签 */
export async function removeGoalTag(id: number): Promise<boolean> {
  await request<void>({
    url: API.goalTags.detail(id),
    method: 'DELETE',
  })
  return true
}
