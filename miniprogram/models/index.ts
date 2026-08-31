// models/index.ts
// 与后端数据库表结构一一对应的类型定义
// 字段采用小驼峰命名，注释中标注对应的数据库字段

/** 用户表 users */
export interface User {
  id: number
  openId: string          // open_id
  unionId?: string        // union_id
  nickName: string        // nick_name
  avatarUrl: string       // avatar_url
  phone?: string          // phone（加密存储）
  userStatus: 0 | 1       // user_status：0 正常 / 1 禁用
  lastLoginTime?: number  // last_login_time
  createdAt: number       // created_at
  updatedAt: number       // updated_at
}

/** 角色表 roles（后端管理使用，本地不持久化） */
export interface Role {
  id: number
  rolesName: string       // roles_name，如 admin / editor / user
  displayName: string     // display_name
  description?: string
  createdAt?: number
}

/** 权限表 permissions（后端管理使用，本地不持久化） */
export interface Permission {
  id: number
  permissionCode: string    // permission_code，如 news:publish
  permissionName: string    // permission_name
  permissionModule: string  // permission_module
}

/** 用户-角色关联表 user_roles（后端管理使用，本地不持久化） */
export interface UserRole {
  userId: number
  roleId: number
  createdAt?: number
}

/** 角色-权限关联表 role_permissions（后端管理使用，本地不持久化） */
export interface RolePermission {
  roleId: number
  permissionId: number
}

/** 用户登录凭证表 user_credentials（后端管理使用，本地不持久化） */
export interface UserCredential {
  id: number
  userId: number
  username: string
  passwordHash: string
  lastLoginIp?: string
}

/** 年计划表 yearly_goals */
export interface YearlyGoal {
  id: number
  userId: number
  title: string
  description?: string      // 详细描述或关键结果
  targetYear: number        // target_year，如 2026
  progress: number          // 当前进度百分比 0-100
  yearlyStatus: 1 | 2 | 3   // yearly_status：1 进行中 / 2 已完成 / 3 已放弃
  createdAt: number
  updatedAt: number
}

/** 周计划表 weekly_plans */
export interface WeeklyPlan {
  id: number
  userId: number
  yearlyGoalId?: number     // yearly_goal_id，可选关联的年计划
  weekStartDate: string     // week_start_date，'YYYY-MM-DD'，通常周一
  weekEndDate: string       // week_end_date，'YYYY-MM-DD'，通常周日
  content: string[]         // content，周计划内容列表（JSON 数组）
  review: string            // review，周复盘/总结
  createdAt: number
}

/** 日计划/日程表 daily_schedules */
export interface DailySchedule {
  id: number
  userId: number
  planDate: string          // plan_date，'YYYY-MM-DD'
  startTime: string         // start_time，'HH:mm'
  endTime: string           // end_time，'HH:mm'
  taskContent: string       // task_content，事项内容
  isCompleted: boolean      // is_completed
  selfScore?: number        // self_score，自我评分 1-10
  sortOrder: number         // sort_order，排序权重
  createdAt: number
}

/** 日反思与总结表 daily_reflections（一天一条） */
export interface DailyReflection {
  id: number
  userId: number
  planDate: string          // plan_date，唯一索引，一天一条
  morningReview: string     // morning_review，上午反思
  afternoonReview: string   // afternoon_review，下午反思
  eveningSummary: string    // evening_summary，一日总结
  totalScoreAvg?: number    // total_score_avg，当日事项评分平均值
}
