// services/daily-reflection.ts
// 日反思服务（对应 daily_reflections 表，一天一条），通过 API 调用后端
import { request } from '../utils/request'
import { API } from '../api/endpoints'
import { DailyReflection } from '../models'

/** 获取某天的反思记录 */
export async function getReflectionByDate(planDate: string): Promise<DailyReflection | null> {
  return request<DailyReflection>({
    url: API.dailyReflections.detail(planDate),
    method: 'GET',
  })
}

/** 保存某天反思（upsert：不存在则创建，存在则合并更新） */
export async function saveReflection(
  planDate: string,
  patch: Partial<
    Pick<DailyReflection, 'morningReview' | 'afternoonReview' | 'eveningSummary' | 'totalScoreAvg'>
  >
): Promise<DailyReflection> {
  return request<DailyReflection>({
    url: API.dailyReflections.detail(planDate),
    method: 'PUT',
    data: patch,
  })
}
