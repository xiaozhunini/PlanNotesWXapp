// services/yearly-goal.ts
// 年计划服务（对应 yearly_goals 表），当前为本地存储实现
import { read, write, nextId } from '../utils/storage'
import { ensureUser } from './user'
import { YearlyGoal } from '../models'

const KEY = 'yearly_goals'

export interface YearlyGoalInput {
  title: string
  tagId?: number             // 关联标签ID
  description?: string
  targetYear?: number
  progress?: number
  yearlyStatus?: YearlyGoal['yearlyStatus']
}

/** 年计划列表，可按年份筛选（年份倒序、创建时间倒序） */
export async function listYearlyGoals(targetYear?: number): Promise<YearlyGoal[]> {
  const userId = (await ensureUser()).id
  const goals = read<YearlyGoal[]>(KEY, []).filter(g => g.userId === userId)
  const filtered = targetYear ? goals.filter(g => g.targetYear === targetYear) : goals
  return filtered.sort((a, b) => b.targetYear - a.targetYear || b.createdAt - a.createdAt)
}

/** 按 ID 获取年计划 */
export async function getYearlyGoal(id: number): Promise<YearlyGoal | null> {
  return read<YearlyGoal[]>(KEY, []).find(g => g.id === id) || null
}

/** 新增年计划 */
export async function addYearlyGoal(input: YearlyGoalInput): Promise<YearlyGoal> {
  const user = await ensureUser()
  const now = Date.now()
  const goal: YearlyGoal = {
    id: nextId(KEY),
    userId: user.id,
    tagId: input.tagId,                // 关联标签（可选）
    title: input.title.trim(),
    description: input.description || '',
    targetYear: input.targetYear || new Date().getFullYear(),
    progress: input.progress ?? 0,
    yearlyStatus: input.yearlyStatus || 1,
    createdAt: now,
    updatedAt: now,
  }
  const goals = read<YearlyGoal[]>(KEY, [])
  goals.unshift(goal)
  write(KEY, goals)
  return goal
}

/** 更新年计划 */
export async function updateYearlyGoal(
  id: number,
  patch: Partial<Omit<YearlyGoal, 'id' | 'userId' | 'createdAt'>>
): Promise<YearlyGoal | null> {
  const goals = read<YearlyGoal[]>(KEY, [])
  const index = goals.findIndex(g => g.id === id)
  if (index === -1) return null
  goals[index] = { ...goals[index], ...patch, updatedAt: Date.now() }
  write(KEY, goals)
  return goals[index]
}

/** 删除年计划 */
export async function removeYearlyGoal(id: number): Promise<boolean> {
  const goals = read<YearlyGoal[]>(KEY, [])
  const rest = goals.filter(g => g.id !== id)
  write(KEY, rest)
  return rest.length !== goals.length
}
