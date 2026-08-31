# PlanNotesWXapp 计划笔记小程序

一款「年计划 → 周计划 → 日日程 → 每日反思」的个人规划类微信小程序。数据层当前基于本地存储实现，后续可平滑切换为后端 API。

## 技术栈

- 微信小程序原生框架（非 Taro/uni-app）
- TypeScript + SCSS
- Skyline 渲染引擎 + glass-easel 组件框架
- 自定义导航栏

## 项目结构

```
PlanNotesWXapp
├── miniprogram/                    # 小程序源码目录
│   ├── app.ts                      # 应用入口：全局数据、启动逻辑（登录等）
│   ├── app.json                    # 全局配置：页面注册、窗口样式、tabBar 等
│   ├── app.scss                    # 全局样式
│   ├── sitemap.json                # 小程序索引配置（控制页面是否被搜索收录）
│   │
│   ├── components/                 # 公共组件
│   │   └── navigation-bar/         # 自定义导航栏（适配胶囊按钮位置，支持返回键）
│   │
│   ├── models/                     # 数据模型：与后端数据库表一一对应的类型定义
│   │   └── index.ts                #   users / yearly_goals / weekly_plans /
│   │                               #   daily_schedules / daily_reflections 及 RBAC 相关类型
│   │
│   ├── services/                   # 数据服务层：页面唯一的数据入口，增删改查都从这里调
│   │   ├── user.ts                 #   用户服务：本地模拟单用户登录（users 表）
│   │   ├── yearly-goal.ts          #   年计划 CRUD（yearly_goals 表）
│   │   ├── weekly-plan.ts          #   周计划 CRUD，自动计算周结束日期（weekly_plans 表）
│   │   ├── daily-schedule.ts       #   日日程 CRUD、完成状态切换（daily_schedules 表）
│   │   └── daily-reflection.ts     #   日反思读写，一天一条 upsert（daily_reflections 表）
│   │
│   ├── utils/                      # 工具函数
│   │   ├── storage.ts              #   本地存储统一封装（读写、key 前缀、自增主键 nextId）
│   │   └── util.ts                 #   通用工具：时间格式化 formatTime/formatDate/formatHM、日期加减 addDays
│   │
│   └── pages/                      # 页面（每个页面含 .ts/.wxml/.scss/.json 四件套）
│       ├── index/                  #   首页（当前为模板演示页，待改造）
│       └── logs/                   #   启动日志页（模板演示页）
│
├── typings/                        # 类型声明目录（这下面得内容主要是用于给tsconfig.json去给 TypeScript 类型检查）
│   └── types/wx/                   #   微信小程序官方 API 类型（lib.wx.api.d.ts 等）
│
├── project.config.json             # 项目配置：AppID、编译插件（TS/SASS）、基础库版本
├── project.private.config.json     # 本地个人配置（不入库的个性化设置）
├── .eslinttrc.json                 # ESLint 配置：代码规范检查配置
├── tsconfig.json                   # TypeScript 编译配置
├── package.json                    # 依赖管理（当前仅 miniprogram-api-typings）
└── README.md                       # 项目说明
```

## 数据层设计

- **本地存储当数据库**：`utils/storage.ts` 统一封装 `wx.getStorageSync`/`wx.setStorageSync`，存储 key 统一加 `plannotes_` 前缀；`nextId()` 模拟数据库自增主键
- **服务层签名全部 async**：页面调用形如 `await listSchedulesByDate('2026-08-31')`，后续接入后端 API 时只需替换 services 内部实现（改为 `wx.request`），页面代码零改动
- **userId 自动注入**：各业务 service 内部通过 `ensureUser()` 获取当前用户 id，页面无需关心
- **RBAC 表不落本地**：roles / permissions / user_credentials 属于后端职责，本地仅在 models 中定义类型

## 数据表 ↔ 服务对照

| 数据库表 | 服务文件 | 说明 |
|---|---|---|
| users | services/user.ts | 用户基础信息，本地模拟登录 |
| yearly_goals | services/yearly-goal.ts | 年度目标，含进度与状态 |
| weekly_plans | services/weekly-plan.ts | 周计划，可选关联年目标 |
| daily_schedules | services/daily-schedule.ts | 每日日程行（时间段/事项/评分） |
| daily_reflections | services/daily-reflection.ts | 上午/下午反思与一日总结 |
| roles / permissions 等RBAC表 | —（models 中仅类型） | 由后端 API 下发 |
