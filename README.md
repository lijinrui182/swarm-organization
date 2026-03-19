# Swarm Organization

一个面向 Web 项目交付场景的自动化 MVP，把一句需求串成完整的交付闭环：

`需求 -> 结构化方案 -> 代码产物 -> 预览验证 -> 修复重试 -> 打包交付`

当前版本以 Node.js 实现可运行闭环，重点验证“订单式交付”而不是“聊天式对话”的产品形态。你可以通过浏览器界面或 API 提交一句项目需求，系统会自动生成一个可运行的网站 starter，并产出预览图、README、交付报告和 zip 包。

## 项目简介

Swarm Organization 适合用来验证以下流程：

- 把自然语言需求转换成结构化 spec
- 按阶段生成交付计划与文件清单
- 生成可运行的 Web 项目模板
- 自动验证页面、关键区块和交付文件是否完整
- 在验证失败时触发修复重试
- 产出可以直接下载和验收的交付物

## 当前能力

- 支持通过 Web UI 或 HTTP API 创建任务
- 支持任务状态查询、阶段追踪、指标查看和事件流订阅
- 支持生成交付目录、预览图、报告和压缩包
- 支持 LiteLLM 网关或直连模型路由
- 在未配置模型网关时，仍可走 deterministic fallback 保证本地可跑

## 技术说明

- 运行时：Node.js
- 接口层：原生 `http` 服务
- 前端：静态 Web UI
- 存储：本地 JSON 文件
- 交付目标：Web project starter

长期目标栈是 `Python + FastAPI + Pydantic + PostgreSQL + Redis + LangGraph`。当前仓库保留了清晰的阶段边界，便于后续迁移。

## 快速开始

### 1. 安装环境

需要本机已安装 Node.js 18+。

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，按需填写：

```bash
cp .env.example .env
```

如果你没有配置 LiteLLM 或模型 API Key，系统也可以走本地 fallback 模式。

### 3. 启动服务

```bash
npm start
```

启动后打开：

```text
http://127.0.0.1:3000
```

## 使用说明

### Web UI

1. 打开本地页面
2. 输入一句项目需求
3. 提交任务
4. 等待系统完成 spec、planner、generator、runner、verifier、repairer、packager 各阶段
5. 在任务详情中查看预览、报告和交付包

### API

常用接口如下：

- `GET /api/health`
- `GET /api/model-status`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `GET /api/metrics`
- `GET /api/events`
- `GET /artifacts/...`

创建任务示例：

```bash
curl -X POST http://127.0.0.1:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a dark tech AI tools directory for university students",
    "outputType": "web_project",
    "framework": "nextjs",
    "style": "dark_tech",
    "targetPlatform": "web"
  }'
```

## 测试命令

基础冒烟：

```bash
npm run smoke
```

后端回归检查：

```bash
npm run backend-check
```

## 目录结构

```text
src/
  core/        # 调度、任务存储、事件、知识库、成本与资源监控
  engines/     # spec / planner / generator / runtime / verifier / repairer / packager
  llm/         # LiteLLM 与直连模型客户端
  utils/       # 工具函数
web/           # 本地 Web UI
docs/          # 架构说明
scripts/       # smoke 与回归脚本
deliveries/    # 任务交付产物（运行时生成）
data/          # 本地状态与缓存（运行时生成）
```

## 交付产物

每个成功任务会在 `deliveries/<task-id>/` 下生成：

- `project/`
- `preview/home.svg`
- `project.zip`
- `delivery_report.json`
- `delivery_summary.md`

## 模型路由说明

当前后端支持这些阶段接入 LiteLLM 或直连模型：

- `Spec Builder`
- `Planner`
- `Generator`
- `Verifier`
- `Repairer`
- `Finalizer`

相关配置见 `.env.example`，可以按阶段分别指定 provider、model 和 fallback chain。

## 已知边界

- 当前是 MVP，不是生产级多租户系统
- 数据存储仍为本地 JSON 文件
- 默认交付目标聚焦在 Web 项目 starter
- Python/FastAPI 版本尚未落地到当前仓库

## 适合放在 GitHub 的仓库简介

**Short description**

`An MVP for turning short web project briefs into runnable deliverables, previews, reports, and zipped handoff packages.`

**Suggested topics**

`nodejs`, `automation`, `delivery-system`, `litellm`, `web-generator`, `workflow`, `mvp`

## 补充文档

- `docs/architecture.md`: 架构和迁移说明
