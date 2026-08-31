// services/daily-reflection.ts
// 日反思服务（对应 daily_reflections 表，一天一条），当前为本地存储实现
import { read, write, nextId } from '../utils/storage'
import { ensureUser } from './user'
import { DailyReflection } from '../models'

const KEY = 'daily_reflections'

/** 获取某天的反思记录（一天一条） */
export async function getReflectionByDate(planDate: string): Promise<DailyReflection | null> {
  const userId = (await ensureUser()).id
  return read<DailyReflection[]>(KEY, []).find(
    r => r.userId === userId && r.planDate === planDate
  ) || null
}

/** 保存某天反思（已存在则合并更新，不存在则创建，对应数据库唯一索引语义） */
export async function saveReflection(
  planDate: string,
  patch: Partial<
    Pick<DailyReflection, 'morningReview' | 'afternoonReview' | 'eveningSummary' | 'totalScoreAvg'>
  >
): Promise<DailyReflection> {
  const user = await ensureUser()
  const reflections = read<DailyReflection[]>(KEY, [])
  let index = reflections.findIndex(r => r.userId === user.id && r.planDate === planDate)
  if (index === -1) {
    const item: DailyReflection = {
      id: nextId(KEY),
      userId: user.id,
      planDate,
      morningReview: '',
      afternoonReview: '',
      eveningSummary: '',
      createdAt: Date.now(),
    }
    reflections.unshift(item)
    index = 0
  }
  reflections[index] = { ...reflections[index], ...patch }
  write(KEY, reflections)
  return reflections[index]
}
