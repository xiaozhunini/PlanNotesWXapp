// services/weekly-plan.ts
// 周计划服务（对应 weekly_plans 表），当前为本地存储实现
import { read, write, nextId } from '../utils/storage'
import { ensureUser } from './user'
import { formatDate, addDays } from '../utils/util'
import { WeeklyPlan } from '../models'

const KEY = 'weekly_plans'

export interface WeeklyPlanInput {
  weekStartDate: string     // 'YYYY-MM-DD'，通常传周一日期
  yearlyGoalId?: number     // 可选，关联的年计划
  content?: string[]        // 周计划内容列表
}

/** 周计划列表（按开始日期倒序） */
export async function listWeeklyPlans(): Promise<WeeklyPlan[]> {
  const userId = (await ensureUser()).id
  return read<WeeklyPlan[]>(KEY, [])
    .filter(p => p.userId === userId)
    .sort((a, b) => (a.weekStartDate < b.weekStartDate ? 1 : -1))
}

/** 根据日期取所在周的计划 */
export async function getWeeklyPlanByDate(date: string): Promise<WeeklyPlan | null> {
  const plans = await listWeeklyPlans()
  // 'YYYY-MM-DD' 格式可直接用字符串比较
  return plans.find(p => p.weekStartDate <= date && date <= p.weekEndDate) || null
}

/** 新增周计划（周结束日期自动按开始日期 +6 天计算） */
export async function addWeeklyPlan(input: WeeklyPlanInput): Promise<WeeklyPlan> {
  const user = await ensureUser()
  const now = Date.now()
  const weekEndDate = formatDate(addDays(new Date(input.weekStartDate), 6))
  const plan: WeeklyPlan = {
    id: nextId(KEY),
    userId: user.id,
    yearlyGoalId: input.yearlyGoalId,
    weekStartDate: input.weekStartDate,
    weekEndDate,
    content: input.content || [],
    review: '',
    createdAt: now,
  }
  const plans = read<WeeklyPlan[]>(KEY, [])
  plans.unshift(plan)
  write(KEY, plans)
  return plan
}

/** 更新周计划（内容/复盘/关联年计划） */
export async function updateWeeklyPlan(
  id: number,
  patch: Partial<Pick<WeeklyPlan, 'content' | 'review' | 'yearlyGoalId'>>
): Promise<WeeklyPlan | null> {
  const plans = read<WeeklyPlan[]>(KEY, [])
  const index = plans.findIndex(p => p.id === id)
  if (index === -1) return null
  plans[index] = { ...plans[index], ...patch }
  write(KEY, plans)
  return plans[index]
}

/** 删除周计划 */
export async function removeWeeklyPlan(id: number): Promise<boolean> {
  const plans = read<WeeklyPlan[]>(KEY, [])
  const rest = plans.filter(p => p.id !== id)
  write(KEY, rest)
  return rest.length !== plans.length
}
