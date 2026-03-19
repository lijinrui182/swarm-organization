const SECTION_LINKS = [
  { id: "command-center", label: "任务下达", caption: "需求输入、交付类型与执行策略" },
  { id: "api-onboarding", label: "API 接入", caption: "OpenClaw 风格终端引导与模型接入" },
  { id: "workflow", label: "执行流程", caption: "从需求解析到打包交付的链路图" },
  { id: "agents", label: "模块状态", caption: "AI 团队分工、模型与阶段输出" },
  { id: "artifacts", label: "产物预览", caption: "预览、文件树、日志与验收结果" },
];

const OUTPUT_TYPES = [
  { value: "web_project", label: "网页项目" },
  { value: "solution_report", label: "方案报告" },
  { value: "content_delivery", label: "内容方案" },
];

const FRAMEWORKS = [
  { value: "nextjs", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "static_node", label: "Static Node" },
];

const STYLES = [
  { value: "dark_tech", label: "Future Control" },
  { value: "clean_saas", label: "Executive SaaS" },
  { value: "editorial_warm", label: "Editorial Calm" },
  { value: "vibrant_travel", label: "Signal Rich" },
];

const TARGET_PLATFORMS = [
  { value: "web", label: "Web 控制台" },
  { value: "desktop_web", label: "桌面 Web" },
  { value: "mobile_web", label: "移动 Web" },
];

const STAGES = [
  { id: "spec_builder", name: "需求解析", code: "SPEC", system: "Spec Builder", caption: "把一句话 brief 转成结构化交付规格。", waiting: "等待接收新任务并抽取目标、约束与验收标准。", running: "正在解析用户意图、交付边界与核心功能。" },
  { id: "planner", name: "规格生成", code: "PLAN", system: "Planner", caption: "生成执行蓝图、文件计划与验收策略。", waiting: "等待 Spec 完成后生成执行路线图。", running: "正在拆分步骤、文件结构与验证计划。" },
  { id: "generator", name: "任务规划", code: "GEN", system: "Generator", caption: "输出 UI、内容与代码初稿。", waiting: "等待计划确认后开始生成项目资产。", running: "正在生成页面结构、内容方案与工程文件。" },
  { id: "runner", name: "运行测试", code: "RUN", system: "Runtime", caption: "启动产物、采样预览并回传运行状态。", waiting: "等待生成结果落盘后启动运行时。", running: "正在写盘、启动预览并采集截图。" },
  { id: "verifier", name: "结果验收", code: "QA", system: "Verifier", caption: "检查工程状态、页面完整性与内容质量。", waiting: "等待运行结果后进行自动验收。", running: "正在对照 Spec 做工程、页面与内容检查。" },
  { id: "repairer", name: "自动修复", code: "FIX", system: "Repairer", caption: "验收失败时自动重试、修复并复检。", waiting: "仅当验收失败时触发修复闭环。", running: "正在执行修复回合并二次验证。" },
  { id: "packager", name: "打包交付", code: "PKG", system: "Packager", caption: "整理预览、报告、源码包与交付摘要。", waiting: "等待验收通过后封装交付物。", running: "正在归档产物、报告与预览资源。" },
];

const TEMPLATE_LIBRARY = [
  { id: "ai_control_center", name: "AI 中控台", meta: "三栏工作台 / 深色科技 / 企业级交付", prompt: "请设计一个 AI 项目交付平台控制台，包含三栏布局、执行流程图、模块状态卡片、产物预览和交付侧栏。", outputType: "web_project", framework: "nextjs", style: "dark_tech", targetPlatform: "web" },
  { id: "saas_launch", name: "SaaS 官网交付", meta: "Hero / Case Studies / Pricing / FAQ", prompt: "做一个 AI SaaS 官网，风格冷静高级，包含 hero、案例、定价、FAQ 和明显转化按钮。", outputType: "web_project", framework: "nextjs", style: "clean_saas", targetPlatform: "web" },
  { id: "ops_dashboard", name: "运营仪表盘", meta: "KPI / Workflow / Activity Feed / QA", prompt: "做一个企业级 AI 运营控制台，包含 KPI 卡片、流程看板、告警流和操作日志，深色、未来感但克制。", outputType: "web_project", framework: "react", style: "dark_tech", targetPlatform: "desktop_web" },
  { id: "delivery_report", name: "交付报告流", meta: "方案摘要 / 路线图 / 风险与结论", prompt: "做一个 AI 交付报告页面，展示需求摘要、交付范围、执行路线、风险控制和最终建议。", outputType: "solution_report", framework: "nextjs", style: "editorial_warm", targetPlatform: "web" },
];

const state = {
  tasks: [],
  selectedTaskId: null,
  modelStatus: null,
  systemMetrics: null,
  setupGuide: null,
  setupMode: "",
  copyPayloads: {},
  isSubmitting: false,
  activeSection: "command-center",
  form: { prompt: "", outputType: "web_project", framework: "nextjs", style: "dark_tech", targetPlatform: "web" },
};

const elements = {
  brandStatusLine: document.getElementById("brand-status-line"),
  brandKpiGrid: document.getElementById("brand-kpi-grid"),
  sectionNav: document.getElementById("section-nav"),
  currentProjectCount: document.getElementById("current-project-count"),
  currentProjectList: document.getElementById("current-project-list"),
  historyTaskList: document.getElementById("history-task-list"),
  templateList: document.getElementById("template-list"),
  commandCenter: document.getElementById("command-center"),
  apiOnboarding: document.getElementById("api-onboarding"),
  workflow: document.getElementById("workflow"),
  agents: document.getElementById("agents"),
  artifacts: document.getElementById("artifacts"),
  systemStatus: document.getElementById("system-status"),
  modelStatusPanel: document.getElementById("model-status-panel"),
  costPanel: document.getElementById("cost-panel"),
  runtimePanel: document.getElementById("runtime-panel"),
  deliverablePanel: document.getElementById("deliverable-panel"),
};
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function humanize(value) {
  if (!value) return "--";
  return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function findOption(list, value, fallback = "--") {
  return list.find((item) => item.value === value)?.label || fallback;
}

function shorten(value, maxLength = 72) {
  const text = String(value ?? "").trim();
  if (!text) return "未命名任务";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function relativeTime(value) {
  if (!value) return "刚刚";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function formatDurationMs(value) {
  const totalMs = Number(value || 0);
  if (!totalMs) return "--";
  const totalSeconds = Math.max(1, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function elapsedFrom(startedAt, finishedAt) {
  if (!startedAt) return "--";
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  return formatDurationMs(end - new Date(startedAt).getTime());
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function statusClass(status) {
  return ["idle", "pending", "queued", "running", "succeeded", "failed", "skipped"].includes(status) ? status : "idle";
}

function statusLabel(status) {
  const labels = { idle: "空闲", pending: "待命", queued: "排队中", running: "执行中", succeeded: "已完成", failed: "失败", skipped: "未触发" };
  return labels[status] || labels.idle;
}

function connectionSummary() {
  const connection = state.modelStatus?.connection;
  if (!connection) {
    return { statusClass: "idle", label: "模型总线待初始化", detail: "等待读取网关与直连模型状态。" };
  }
  if (connection.enabled && connection.gatewayConfigured) {
    return { statusClass: "succeeded", label: "LiteLLM 网关已连接", detail: state.modelStatus?.baseUrl || connection.baseUrl || "Gateway Ready" };
  }
  if (connection.enabled) {
    return { statusClass: "running", label: "直连模型在线", detail: connection.mode === "direct" ? "Direct Provider Routing" : humanize(connection.mode) };
  }
  return { statusClass: "failed", label: "模型未配置", detail: "当前将回退到确定性生成流程。" };
}

function taskPrompt(task) {
  return task?.input || task?.context?.prompt || "";
}

function looksCorruptedText(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return /�|锟|��/.test(text);
}

function fallbackTaskLabel(task) {
  const projectName = getStageStep(task, "generator")?.output?.identity?.projectName;
  if (projectName && !looksCorruptedText(projectName)) return projectName;
  const projectType = humanize(task?.spec?.projectType || task?.taskType || "web_project");
  const targetUsers = String(task?.spec?.targetUsers || "").trim();
  if (targetUsers && !looksCorruptedText(targetUsers)) return `${projectType} · ${targetUsers}`;
  return `${projectType} 交付任务`;
}

function displayTaskPrompt(task) {
  const prompt = taskPrompt(task);
  if (prompt && !looksCorruptedText(prompt)) return prompt;
  return fallbackTaskLabel(task);
}

function taskTitle(task) {
  if (!task) return "等待新的交付任务";
  return shorten(displayTaskPrompt(task), 72);
}

function getSelectedTask() {
  return state.tasks.find((task) => task.id === state.selectedTaskId) || null;
}

function getStageStep(task, stageId) {
  return task?.steps?.[stageId] || null;
}

function getRepairAttempts(task) {
  return safeArray(task?.result?.repair);
}

function getStageStatus(task, stageId) {
  if (!task) return "idle";
  const explicit = getStageStep(task, stageId)?.status;
  if (explicit) return explicit;
  if (task.status === "queued" && stageId === STAGES[0].id) return "queued";
  if (stageId === "repairer" && task.status === "succeeded" && !getRepairAttempts(task).length) return "skipped";
  if (stageId === "packager" && task.status === "failed") return "skipped";
  return "pending";
}

function getCurrentStageId(task) {
  if (!task) return STAGES[0].id;
  const failed = STAGES.find((stage) => getStageStatus(task, stage.id) === "failed");
  if (failed) return failed.id;
  const running = STAGES.find((stage) => getStageStatus(task, stage.id) === "running");
  if (running) return running.id;
  const queued = STAGES.find((stage) => getStageStatus(task, stage.id) === "queued");
  if (queued) return queued.id;
  const pending = STAGES.find((stage) => getStageStatus(task, stage.id) === "pending");
  if (pending) return pending.id;
  return STAGES[STAGES.length - 1].id;
}

function getStageRoute(task, stageId) {
  if (stageId === "spec_builder") return task?.spec?.routerDecision || getStageStep(task, stageId)?.output?.routerDecision || state.modelStatus?.router?.stages?.spec_builder || null;
  if (stageId === "planner") return task?.plan?.route || getStageStep(task, stageId)?.output?.route || state.modelStatus?.router?.stages?.planner || null;
  if (stageId === "generator") return getStageStep(task, stageId)?.output?.route || task?.result?.generation?.route || state.modelStatus?.router?.stages?.generator || null;
  if (stageId === "runner") return { provider: "local", model: "project-runtime", reason: "负责落盘、启动预览与生成截图。" };
  if (stageId === "verifier") return task?.result?.verification?.route || getStageStep(task, stageId)?.output?.route || state.modelStatus?.router?.stages?.verifier || null;
  if (stageId === "repairer") return getStageStep(task, stageId)?.output?.route || state.modelStatus?.router?.stages?.repairer || null;
  if (stageId === "packager") return getStageStep(task, stageId)?.output?.route || state.modelStatus?.router?.stages?.finalizer || null;
  return null;
}

function formatRoute(route) {
  if (!route) return "等待路由";
  const provider = route.provider || "local";
  const model = route.model ? route.model.replace(/^[^/]+\//, "") : "--";
  return `${provider} / ${model}`;
}

function deriveProgress(status) {
  if (status === "succeeded" || status === "skipped") return 100;
  if (status === "failed") return 84;
  if (status === "running") return 72;
  if (status === "queued") return 18;
  if (status === "pending") return 8;
  return 4;
}
function buildStageSummary(task, stageId) {
  if (!task) return STAGES.find((stage) => stage.id === stageId)?.caption || "等待任务";
  const spec = task?.spec || getStageStep(task, "spec_builder")?.output;
  const plan = task?.plan || getStageStep(task, "planner")?.output;
  const generation = getStageStep(task, "generator")?.output;
  const runtime = getStageStep(task, "runner")?.output;
  const verification = task?.result?.verification || getStageStep(task, "verifier")?.output;
  const repairs = getRepairAttempts(task);
  const artifacts = task?.result?.artifacts || getStageStep(task, "packager")?.output;

  if (stageId === "spec_builder") return spec ? `${humanize(spec.projectType)} · ${humanize(spec.style)} · ${(spec.coreFeatures || []).length} 个核心模块` : "等待输出结构化规格书";
  if (stageId === "planner") return plan ? `${safeArray(plan.steps).length} 个执行步骤 · ${safeArray(plan.filePlan).length} 个文件目标` : "等待执行蓝图";
  if (stageId === "generator") return generation ? `${generation.identity?.projectName || "Project"} · ${safeArray(generation.projectFiles).length} 个产物文件` : "等待生成项目资产";
  if (stageId === "runner") return runtime ? `${runtime.url ? "预览地址已生成" : "运行中"} · ${runtime.screenshot?.ok ? "截图已回传" : "截图待生成"}` : "等待启动运行时与预览";
  if (stageId === "verifier") return verification ? `Score ${verification.score ?? "--"} · ${verification.passed ? "通过" : "需要修复"}` : "等待验收结果";
  if (stageId === "repairer") {
    if (!repairs.length) return task.status === "succeeded" ? "本次任务无需修复" : "等待验收阶段回传缺陷";
    const latest = repairs[repairs.length - 1];
    return `${repairs.length} 轮修复 · 最新分数 ${latest.score ?? "--"}`;
  }
  if (!artifacts) return "等待封装交付资源";
  const count = [artifacts.previewUrl, artifacts.zipUrl, artifacts.reportUrl, artifacts.summaryUrl].filter(Boolean).length;
  return `${count} 个交付物已可访问`;
}

function buildStageAction(task, stage) {
  const status = getStageStatus(task, stage.id);
  const step = getStageStep(task, stage.id);
  if (status === "running") return stage.running;
  if (status === "failed") return step?.error || "阶段执行失败，等待处理。";
  if (status === "succeeded") return `${stage.system} 已完成当前阶段并把结果交接给下一模块。`;
  if (status === "skipped") return "本轮任务不需要触发该阶段。";
  if (status === "queued") return "任务已入队，等待编排器分配执行槽位。";
  return stage.waiting;
}

function buildStageFacts(task, stageId) {
  const spec = task?.spec || getStageStep(task, "spec_builder")?.output;
  const plan = task?.plan || getStageStep(task, "planner")?.output;
  const generation = getStageStep(task, "generator")?.output;
  const runtime = getStageStep(task, "runner")?.output;
  const verification = task?.result?.verification || getStageStep(task, "verifier")?.output;
  const repairs = getRepairAttempts(task);
  const packager = getStageStep(task, "packager")?.output;
  if (!task) return ["等待任务", "模块将按既定编排顺序联动", "路由状态将在执行时出现"];
  if (stageId === "spec_builder") return [`目标用户: ${spec?.targetUsers || "--"}`, `交付类型: ${findOption(OUTPUT_TYPES, task.context?.outputType || task.taskType, humanize(task.taskType))}`, `核心模块: ${safeArray(spec?.coreFeatures).slice(0, 4).map(humanize).join(" / ") || "--"}`];
  if (stageId === "planner") return [`执行步骤: ${safeArray(plan?.steps).length || 0}`, `文件计划: ${safeArray(plan?.filePlan).length || 0}`, `验证维度: ${Object.keys(plan?.verificationPlan || {}).length || 0}`];
  if (stageId === "generator") return [`项目名: ${generation?.identity?.projectName || "--"}`, `生成文件: ${safeArray(generation?.projectFiles).length || 0}`, `生成模式: ${generation?.generationMode || task?.result?.generation?.mode || "--"}`];
  if (stageId === "runner") return [`运行地址: ${runtime?.url || "待启动"}`, `预览截图: ${runtime?.screenshot?.ok ? "已生成" : "待生成"}`, `执行耗时: ${elapsedFrom(getStageStep(task, stageId)?.startedAt, getStageStep(task, stageId)?.finishedAt)}`];
  if (stageId === "verifier") return [`验收得分: ${verification?.score ?? "--"}`, `内容缺口: ${safeArray(verification?.content?.missingFeatures).length}`, `页面状态: ${verification?.page?.blankPage ? "存在空白页" : "页面正常"}`];
  if (stageId === "repairer") return [`修复轮次: ${repairs.length}`, `最近结果: ${repairs.length ? (repairs[repairs.length - 1].passed ? "通过" : "继续修复") : "未触发"}`, `自动修复: ${repairs.length ? "已记录" : "本轮未启用"}`];
  return [`交付报告: ${packager?.reportPath ? "已归档" : "待生成"}`, `压缩包: ${packager?.zipPath ? "已归档" : "待生成"}`, `预览资源: ${packager?.previewPath ? "已归档" : "待生成"}`];
}

function buildTimeline(task) {
  if (!task) return [];
  const logs = [{ time: task.createdAt, label: "任务接收", detail: shorten(displayTaskPrompt(task), 120) }];
  STAGES.forEach((stage) => {
    const step = getStageStep(task, stage.id);
    if (!step) return;
    if (step.startedAt) logs.push({ time: step.startedAt, label: `${stage.system} 启动`, detail: stage.running });
    if (step.finishedAt) logs.push({ time: step.finishedAt, label: `${stage.system} ${step.status === "failed" ? "失败" : "完成"}`, detail: step.error || buildStageSummary(task, stage.id) });
  });
  if (task.finishedAt) logs.push({ time: task.finishedAt, label: task.status === "succeeded" ? "交付完成" : "任务结束", detail: task.status === "succeeded" ? "交付物已整理完毕，可执行预览与下载。" : task.error || "任务执行结束。" });
  return logs.filter((item) => item.time).sort((left, right) => new Date(left.time).getTime() - new Date(right.time).getTime()).slice(-10);
}

function estimateTokens(task) {
  if (!task) return 0;
  const aggregate = [task.input, JSON.stringify(task.spec || {}), JSON.stringify(task.plan || {}), JSON.stringify(task.result?.verification || {}), JSON.stringify(task.result?.repair || [])].filter(Boolean).join(" ");
  return Math.max(0, Math.round(aggregate.length / 4));
}

function buildTree(paths) {
  const list = safeArray(paths).filter(Boolean);
  if (!list.length) return "project/\n  waiting-for-output";
  const root = {};
  list.forEach((filePath) => {
    const parts = String(filePath).split(/[\\/]/).filter(Boolean);
    let node = root;
    parts.forEach((part, index) => {
      if (!node[part]) node[part] = { __file: index === parts.length - 1 };
      if (index === parts.length - 1) node[part].__file = true;
      node = node[part];
    });
  });
  function renderNode(node, depth) {
    return Object.keys(node).filter((key) => key !== "__file").sort((left, right) => {
      const leftFile = node[left].__file && Object.keys(node[left]).length === 1;
      const rightFile = node[right].__file && Object.keys(node[right]).length === 1;
      if (leftFile !== rightFile) return leftFile ? 1 : -1;
      return left.localeCompare(right);
    }).flatMap((key) => {
      const child = node[key];
      const isFile = child.__file && Object.keys(child).length === 1;
      const line = `${"  ".repeat(depth)}${key}${isFile ? "" : "/"}`;
      return [line, ...renderNode(child, depth + 1)];
    });
  }
  return ["project/", ...renderNode(root, 1)].join("\n");
}

function buildReadmeSnippet(task) {
  const readme = task?.result?.verification?.content?.readmePreview;
  if (readme) return readme;
  if (!task) return "等待任务后，这里会显示 README 摘要、交付说明与启动命令。";
  return [`# ${taskTitle(task)}`, "", `- 交付类型: ${findOption(OUTPUT_TYPES, task.context?.outputType || task.taskType, humanize(task.taskType))}`, `- 技术栈: ${findOption(FRAMEWORKS, task.context?.framework || task.spec?.framework, humanize(task.context?.framework || task.spec?.framework || "nextjs"))}`, `- 视觉方向: ${findOption(STYLES, task.context?.style || task.spec?.style, humanize(task.context?.style || task.spec?.style || "dark_tech"))}`, `- 目标平台: ${findOption(TARGET_PLATFORMS, task.context?.targetPlatform || state.form.targetPlatform, humanize(task.context?.targetPlatform || state.form.targetPlatform))}`, "", "README 摘要将在 Verifier 产出后自动同步到这里。"].join("\n");
}

function buildTestTiles(task) {
  const verification = task?.result?.verification || getStageStep(task, "verifier")?.output;
  if (!verification) {
    return [
      { label: "工程检查", value: "待运行", note: "等待 Runtime 与 Verifier 结果。" },
      { label: "页面检查", value: "待运行", note: "完成预览后自动比对页面状态。" },
      { label: "内容完整性", value: "待运行", note: "对照 Spec 检查模块缺失与占位文案。" },
      { label: "综合得分", value: "--", note: "验收结束后给出分数与是否通过。" },
    ];
  }
  return [
    { label: "工程检查", value: verification.engineering?.serverStarts && verification.engineering?.httpOk ? "PASS" : "WARN", note: `Server ${verification.engineering?.serverStarts ? "OK" : "NO"} / HTTP ${verification.engineering?.httpOk ? "OK" : "NO"} / Files ${verification.engineering?.filesPresent ? "OK" : "NO"}` },
    { label: "页面检查", value: verification.page?.blankPage ? "BLOCK" : "PASS", note: `Preview ${verification.page?.previewGenerated ? "READY" : "PENDING"} / Blank ${verification.page?.blankPage ? "YES" : "NO"}` },
    { label: "内容完整性", value: safeArray(verification.content?.missingFeatures).length ? `${safeArray(verification.content?.missingFeatures).length} GAP` : "PASS", note: safeArray(verification.content?.missingFeatures).length ? `Missing: ${verification.content.missingFeatures.map(humanize).join(", ")}` : "未发现缺失模块与明显占位内容。" },
    { label: "综合得分", value: verification.score ?? "--", note: verification.passed ? "验收通过，可进入交付封装。" : "需要进入修复闭环。" },
  ];
}

function buildCurrentProjects() {
  const live = state.tasks.filter((task) => ["queued", "running"].includes(task.status));
  return live.length ? live.slice(0, 5) : state.tasks.slice(0, 3);
}

function buildHistoryTasks() {
  const currentIds = new Set(buildCurrentProjects().map((task) => task.id));
  return state.tasks.filter((task) => !currentIds.has(task.id)).slice(0, 6);
}
function buildBrand() {
  const selected = getSelectedTask();
  const currentProjects = buildCurrentProjects();
  const connection = connectionSummary();
  const metrics = state.systemMetrics?.latest;
  const completed = state.tasks.filter((task) => ["succeeded", "failed"].includes(task.status));
  const succeeded = completed.filter((task) => task.status === "succeeded");
  const successRate = completed.length ? `${Math.round((succeeded.length / completed.length) * 100)}%` : "0%";
  elements.brandStatusLine.innerHTML = [`<span class="micro-pill ${escapeHtml(connection.statusClass)}">${escapeHtml(connection.label)}</span>`, `<span class="micro-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? statusLabel(selected.status) : "等待任务")}</span>`].join("");
  elements.brandKpiGrid.innerHTML = `
    <article class="metric-tile"><span class="metric-label">Live Missions</span><strong class="metric-value">${escapeHtml(String(currentProjects.length))}</strong></article>
    <article class="metric-tile"><span class="metric-label">Success Rate</span><strong class="metric-value">${escapeHtml(successRate)}</strong></article>
    <article class="metric-tile"><span class="metric-label">Queue Load</span><strong class="metric-value">${escapeHtml(String(metrics?.queueLength ?? 0))}</strong></article>
  `;
}

function renderSectionNav() {
  elements.sectionNav.innerHTML = SECTION_LINKS.map((section) => `
    <button class="section-link ${state.activeSection === section.id ? "active" : ""}" type="button" data-scroll-to="${escapeHtml(section.id)}">
      <strong>${escapeHtml(section.label)}</strong>
      <span>${escapeHtml(section.caption)}</span>
    </button>
  `).join("");
}

function renderCurrentProjectList() {
  const tasks = buildCurrentProjects();
  elements.currentProjectCount.textContent = String(tasks.length);
  if (!tasks.length) {
    elements.currentProjectList.innerHTML = '<div class="empty-rail">当前没有进行中的任务，新任务启动后会出现在这里。</div>';
    return;
  }
  elements.currentProjectList.innerHTML = tasks.map((task) => {
    const currentStage = STAGES.find((stage) => stage.id === getCurrentStageId(task));
    return `
      <button class="rail-item ${task.id === state.selectedTaskId ? "active" : ""}" type="button" data-select-task="${escapeHtml(task.id)}">
        <div class="rail-item-top">
          <span class="status-pill ${escapeHtml(statusClass(task.status))}">${escapeHtml(statusLabel(task.status))}</span>
          <span class="tiny-badge ${escapeHtml(statusClass(getStageStatus(task, getCurrentStageId(task))))}">${escapeHtml(currentStage?.code || "TASK")}</span>
        </div>
        <strong class="rail-item-title">${escapeHtml(taskTitle(task))}</strong>
        <p class="rail-item-copy">${escapeHtml(buildStageSummary(task, getCurrentStageId(task)))}</p>
        <div class="rail-item-footer">
          <span class="rail-note">${escapeHtml(findOption(FRAMEWORKS, task.context?.framework || task.spec?.framework, humanize(task.context?.framework || task.spec?.framework || "nextjs")))}</span>
          <span class="rail-note">${escapeHtml(relativeTime(task.updatedAt || task.createdAt))}</span>
        </div>
      </button>
    `;
  }).join("");
}

function renderHistoryTaskList() {
  const tasks = buildHistoryTasks();
  if (!tasks.length) {
    elements.historyTaskList.innerHTML = '<div class="empty-rail">交付历史会在任务执行后自动沉淀到这里。</div>';
    return;
  }
  elements.historyTaskList.innerHTML = tasks.map((task) => `
    <button class="rail-item ${task.id === state.selectedTaskId ? "active" : ""}" type="button" data-select-task="${escapeHtml(task.id)}">
      <div class="rail-item-top">
        <span class="status-pill ${escapeHtml(statusClass(task.status))}">${escapeHtml(statusLabel(task.status))}</span>
        <span class="rail-note">${escapeHtml(formatDateTime(task.createdAt))}</span>
      </div>
      <strong class="rail-item-title">${escapeHtml(taskTitle(task))}</strong>
      <p class="rail-item-copy">${escapeHtml(task.result?.verification?.score != null ? `验收分数 ${task.result.verification.score}` : buildStageSummary(task, "packager"))}</p>
      <div class="rail-item-footer">
        <span class="rail-note">${escapeHtml(findOption(STYLES, task.context?.style || task.spec?.style, humanize(task.context?.style || task.spec?.style || "dark_tech")))}</span>
        <span class="rail-note">${escapeHtml(task.id.slice(-6))}</span>
      </div>
    </button>
  `).join("");
}

function renderTemplateList() {
  elements.templateList.innerHTML = TEMPLATE_LIBRARY.map((template) => `
    <button class="template-chip" type="button" data-template-id="${escapeHtml(template.id)}">
      <strong class="template-name">${escapeHtml(template.name)}</strong>
      <span class="template-meta">${escapeHtml(template.meta)}</span>
    </button>
  `).join("");
}

function renderCommandCenter() {
  const selected = getSelectedTask();
  const currentStage = STAGES.find((stage) => stage.id === getCurrentStageId(selected));
  const connection = connectionSummary();
  const helperText = state.form.outputType === "web_project" ? "提交后系统会自动进入 Spec、Plan、Generate、Runtime、Verify、Package 全链路。" : "当前本地运行时仍以可预览交付流程为主，非网页任务会按同样编排链路交付。";
  elements.commandCenter.innerHTML = `
    <div class="panel-top">
      <div class="panel-heading">
        <p class="eyebrow">Command Deck</p>
        <h2>向 AI 团队下达任务，而不是和单个模型对话</h2>
        <p class="panel-copy">这里是需求入口。用户提交一句话 brief 后，平台会自动解析需求、生成规格、组织执行、运行测试、自动修复并封装交付物。</p>
      </div>
      <div class="inline-tag-row">
        <span class="micro-pill ${escapeHtml(connection.statusClass)}">${escapeHtml(connection.label)}</span>
        <span class="micro-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? `当前任务 ${statusLabel(selected.status)}` : "等待新任务")}</span>
      </div>
    </div>
    <div class="command-grid">
      <div>
        <form id="command-form" class="command-form">
          <label class="form-field" for="command-prompt">
            <div class="field-head"><span class="field-label">需求描述</span><span class="field-note">一句话 brief，系统自动拆解</span></div>
            <textarea id="command-prompt" name="prompt" placeholder="例如：设计一个 AI 项目交付平台主工作台，强调多模块协作、流程控制、交付预览和企业级未来感。">${escapeHtml(state.form.prompt)}</textarea>
          </label>
          <div class="field-grid">
            <label class="form-field"><div class="field-head"><span class="field-label">交付类型</span></div><select id="command-output-type" name="outputType">${OUTPUT_TYPES.map((item) => `<option value="${escapeHtml(item.value)}" ${state.form.outputType === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
            <label class="form-field"><div class="field-head"><span class="field-label">技术栈</span></div><select id="command-framework" name="framework">${FRAMEWORKS.map((item) => `<option value="${escapeHtml(item.value)}" ${state.form.framework === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
            <label class="form-field"><div class="field-head"><span class="field-label">风格</span></div><select id="command-style" name="style">${STYLES.map((item) => `<option value="${escapeHtml(item.value)}" ${state.form.style === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
            <label class="form-field"><div class="field-head"><span class="field-label">目标平台</span></div><select id="command-platform" name="targetPlatform">${TARGET_PLATFORMS.map((item) => `<option value="${escapeHtml(item.value)}" ${state.form.targetPlatform === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
          </div>
          <div class="helper-row"><button class="primary-cta" type="submit" ${state.isSubmitting ? "disabled" : ""}>${escapeHtml(state.isSubmitting ? "正在编排任务..." : "开始执行")}</button><p class="helper-copy">${escapeHtml(helperText)}</p></div>
        </form>
        <div class="quick-template-row">${TEMPLATE_LIBRARY.slice(0, 4).map((template) => `<button class="quick-template-chip" type="button" data-template-id="${escapeHtml(template.id)}">${escapeHtml(template.name)}</button>`).join("")}</div>
      </div>
      <div class="mission-brief">
        <div class="mission-highlight">
          <div><p class="eyebrow">Current Mission</p><strong>${escapeHtml(selected ? taskTitle(selected) : "等待新的交付 brief")}</strong><p>${escapeHtml(selected ? buildStageSummary(selected, getCurrentStageId(selected)) : "系统已就绪，提交需求后会在这里显示当前任务态势。")}</p></div>
          <span class="status-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? statusLabel(selected.status) : "空闲")}</span>
        </div>
        <div class="mission-tiles">
          <article class="mission-tile"><span class="metric-label">当前节点</span><strong>${escapeHtml(currentStage?.name || "需求解析")}</strong></article>
          <article class="mission-tile"><span class="metric-label">交付类型</span><strong>${escapeHtml(findOption(OUTPUT_TYPES, selected?.context?.outputType || state.form.outputType, humanize(selected?.context?.outputType || state.form.outputType)))}</strong></article>
          <article class="mission-tile"><span class="metric-label">技术栈</span><strong>${escapeHtml(findOption(FRAMEWORKS, selected?.context?.framework || state.form.framework, humanize(selected?.context?.framework || state.form.framework)))}</strong></article>
          <article class="mission-tile"><span class="metric-label">目标平台</span><strong>${escapeHtml(findOption(TARGET_PLATFORMS, selected?.context?.targetPlatform || state.form.targetPlatform, humanize(selected?.context?.targetPlatform || state.form.targetPlatform)))}</strong></article>
        </div>
      </div>
    </div>
  `;
  const prompt = document.getElementById("command-prompt");
  if (prompt) autoResizePrompt(prompt);
}
function registerCopyPayload(key, value) {
  state.copyPayloads[key] = value;
  return key;
}

function renderApiOnboarding() {
  if (!elements.apiOnboarding) return;
  const guide = state.setupGuide;
  state.copyPayloads = {};
  if (!guide) {
    elements.apiOnboarding.innerHTML = '<div class="panel-heading"><p class="eyebrow">API Onboarding</p><h2>API 接入引导</h2><p class="panel-copy">正在读取网关与提供商状态，稍后这里会出现像 OpenClaw 一样的终端式接入步骤。</p></div>';
    return;
  }
  const activeModeId = state.setupMode || guide.recommendedMode || guide.modes?.[0]?.id;
  const activeMode = guide.modes.find((mode) => mode.id === activeModeId) || guide.modes[0];
  state.setupMode = activeMode?.id || "";
  const envCopyKey = registerCopyPayload(`env-${activeMode.id}`, activeMode.envBlock);
  const verifyCommand = guide.steps.find((step) => step.id === "verify-routing")?.command || "";
  elements.apiOnboarding.innerHTML = `
    <div class="panel-top">
      <div class="panel-heading">
        <p class="eyebrow">API Onboarding</p>
        <h2>像 OpenClaw 一样做 API 接入</h2>
        <p class="panel-copy">不要让用户在文档里找配置。这里直接给出推荐接入模式、可复制的 PowerShell 命令，以及最小化的 .env 配置块。</p>
      </div>
      <div class="inline-tag-row">
        <span class="micro-pill ${escapeHtml(guide.connection?.enabled ? "succeeded" : "failed")}">${escapeHtml(guide.connection?.enabled ? "API 已接入" : "等待接入")}</span>
        <span class="micro-pill ${escapeHtml(guide.envExists ? "running" : "idle")}">${escapeHtml(guide.envExists ? ".env 已存在" : "待初始化 .env")}</span>
      </div>
    </div>
    <div class="setup-grid">
      <div class="setup-column">
        <div class="mode-grid">
          ${guide.modes.map((mode) => `
            <button class="setup-mode-card ${mode.id === activeMode.id ? "active" : ""}" type="button" data-setup-mode="${escapeHtml(mode.id)}">
              <div class="subpanel-head">
                <div>
                  <p class="eyebrow">${escapeHtml(mode.id === guide.recommendedMode ? "Recommended" : "Mode")}</p>
                  <h3 class="subpanel-title">${escapeHtml(mode.name)}</h3>
                </div>
                <span class="status-pill ${escapeHtml(mode.statusClass)}">${escapeHtml(mode.id === guide.recommendedMode ? "推荐" : statusLabel(mode.statusClass === "idle" ? "pending" : mode.statusClass))}</span>
              </div>
              <p class="setup-note">${escapeHtml(mode.summary)}</p>
              <span class="route-note">${escapeHtml(mode.bestFor)}</span>
            </button>
          `).join("")}
        </div>
        <article class="terminal-step setup-detail-card">
          <div class="subpanel-head">
            <div>
              <p class="eyebrow">Selected Config</p>
              <h3 class="subpanel-title">${escapeHtml(activeMode.name)}</h3>
            </div>
            <button class="subtle-button copy-button" type="button" data-copy-key="${escapeHtml(envCopyKey)}">复制配置块</button>
          </div>
          <div class="inline-tag-row">
            <span class="micro-pill ${escapeHtml(activeMode.statusClass)}">${escapeHtml(activeMode.id === guide.recommendedMode ? "推荐模式" : "当前模式")}</span>
            <span class="micro-pill idle">${escapeHtml(guide.envExists ? ".env 已定位" : ".env 待创建")}</span>
          </div>
          <pre class="terminal-code">${escapeHtml(activeMode.envBlock)}</pre>
        </article>
      </div>
      <div class="setup-column">
        <div class="terminal-step-list">
          ${guide.steps.map((step, index) => {
            const copyKey = registerCopyPayload(`step-${step.id}`, step.command);
            return `
              <article class="terminal-step">
                <div class="subpanel-head">
                  <div>
                    <p class="eyebrow">Step ${String(index + 1).padStart(2, "0")}</p>
                    <h3 class="subpanel-title">${escapeHtml(step.title)}</h3>
                  </div>
                  <button class="subtle-button copy-button" type="button" data-copy-key="${escapeHtml(copyKey)}">复制命令</button>
                </div>
                <p class="setup-note">${escapeHtml(step.note)}</p>
                <pre class="terminal-code">${escapeHtml(step.command)}</pre>
              </article>
            `;
          }).join("")}
          <article class="terminal-step">
            <div class="subpanel-head"><div><p class="eyebrow">Verification</p><h3 class="subpanel-title">当前检测结果</h3></div></div>
            <p class="setup-note">接入完成后，执行验证命令，页面右侧的模型路由状态会同步更新。</p>
            <pre class="terminal-code">${escapeHtml(verifyCommand || "Invoke-RestMethod http://127.0.0.1:3000/api/model-status | ConvertTo-Json -Depth 8")}</pre>
          </article>
        </div>
      </div>
    </div>
  `;
}

function renderWorkflow() {
  const selected = getSelectedTask();
  const currentStageId = getCurrentStageId(selected);
  const completed = selected ? STAGES.filter((stage) => ["succeeded", "skipped"].includes(getStageStatus(selected, stage.id))).length : 0;
  elements.workflow.innerHTML = `
    <div class="panel-top">
      <div class="panel-heading">
        <p class="eyebrow">Workflow Graph</p>
        <h2>完整执行流程可视化</h2>
        <p class="panel-copy">不是聊天记录，而是一条从需求进入系统到最终交付的工程链。当前节点高亮，完成节点显示结果状态，节点之间保持持续的执行感。</p>
      </div>
      <div class="inline-tag-row">
        <span class="micro-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? `已完成 ${completed}/${STAGES.length}` : "等待任务")}</span>
        <span class="micro-pill ${escapeHtml(statusClass(getStageStatus(selected, currentStageId)))}">${escapeHtml(STAGES.find((stage) => stage.id === currentStageId)?.code || "SPEC")}</span>
      </div>
    </div>
    <div class="flow-track">
      ${STAGES.map((stage, index) => {
        const status = getStageStatus(selected, stage.id);
        const step = getStageStep(selected, stage.id);
        const previousStatus = getStageStatus(selected, stage.id);
        const linkClass = ["succeeded", "skipped"].includes(previousStatus) ? "done" : stage.id === currentStageId || previousStatus === "running" ? "active" : "";
        return `
          <div class="flow-step ${escapeHtml(statusClass(status))} ${stage.id === currentStageId ? "current" : ""}">
            <div class="flow-step-top"><div class="inline-row"><span class="step-index">${index + 1}</span><span class="role-chip">${escapeHtml(stage.code)}</span></div><span class="status-pill ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span></div>
            <div><strong class="flow-label">${escapeHtml(stage.name)}</strong><p class="flow-caption">${escapeHtml(stage.caption)}</p></div>
            <p class="flow-note">${escapeHtml(buildStageSummary(selected, stage.id))}</p>
            <div class="flow-footer"><span class="rail-note">${escapeHtml(elapsedFrom(step?.startedAt, step?.finishedAt))}</span><span class="rail-note">${escapeHtml(formatRoute(getStageRoute(selected, stage.id)))}</span></div>
          </div>
          ${index < STAGES.length - 1 ? `<div class="flow-link ${linkClass}"></div>` : ""}
        `;
      }).join("")}
    </div>
  `;
}

function renderAgents() {
  const selected = getSelectedTask();
  const currentStageId = getCurrentStageId(selected);
  elements.agents.innerHTML = `
    <div class="panel-top">
      <div class="panel-heading">
        <p class="eyebrow">Module Matrix</p>
        <h2>模块 / 智能体状态面板</h2>
        <p class="panel-copy">每个模块都是系统内的责任单元，而不是卡通化 AI 头像。这里展示状态、当前动作、耗时、模型以及阶段输出摘要。</p>
      </div>
      <div class="inline-tag-row"><span class="micro-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? taskTitle(selected) : "No Mission Selected")}</span></div>
    </div>
    <div class="agent-grid">
      ${STAGES.map((stage) => {
        const status = getStageStatus(selected, stage.id);
        const step = getStageStep(selected, stage.id);
        const route = getStageRoute(selected, stage.id);
        return `
          <article class="agent-card ${escapeHtml(statusClass(status))} ${stage.id === currentStageId ? "current" : ""}">
            <div class="agent-head"><div class="agent-id-block"><strong class="agent-code">${escapeHtml(stage.system)}</strong><span class="agent-title">${escapeHtml(stage.caption)}</span></div><span class="status-pill ${escapeHtml(statusClass(status))}">${escapeHtml(statusLabel(status))}</span></div>
            <div class="agent-progress"><span class="agent-progress-bar" style="width: ${deriveProgress(status)}%"></span></div>
            <div class="agent-meta">
              <div class="meta-block"><span class="meta-label">当前动作</span><span class="meta-value">${escapeHtml(buildStageAction(selected, stage))}</span></div>
              <div class="meta-block"><span class="meta-label">耗时</span><span class="meta-value">${escapeHtml(elapsedFrom(step?.startedAt, step?.finishedAt))}</span></div>
              <div class="meta-block"><span class="meta-label">使用模型</span><span class="meta-value">${escapeHtml(formatRoute(route))}</span></div>
              <div class="meta-block"><span class="meta-label">输出摘要</span><span class="meta-value">${escapeHtml(buildStageSummary(selected, stage.id))}</span></div>
            </div>
            <p class="agent-summary">${escapeHtml(stage.id === currentStageId ? buildStageAction(selected, stage) : stage.caption)}</p>
            <div class="fact-list">${buildStageFacts(selected, stage.id).map((fact) => `<span class="fact-item">${escapeHtml(fact)}</span>`).join("")}</div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}
function renderArtifacts() {
  const selected = getSelectedTask();
  const previewUrl = selected?.result?.artifacts?.previewUrl || null;
  const projectUrl = selected?.result?.artifacts?.projectUrl || getStageStep(selected, "runner")?.output?.url || "";
  const generation = getStageStep(selected, "generator")?.output;
  const planFiles = safeArray(selected?.plan?.filePlan).map((item) => item.path);
  const files = safeArray(generation?.projectFiles).length ? generation.projectFiles : planFiles;
  const tests = buildTestTiles(selected);
  const timeline = buildTimeline(selected);
  elements.artifacts.innerHTML = `
    <div class="panel-top">
      <div class="panel-heading">
        <p class="eyebrow">Artifact Theater</p>
        <h2>中间产物预览区</h2>
        <p class="panel-copy">用户能看到系统正在真实生产：预览图、文件树、README 摘要、执行日志与测试摘要都在持续刷新，而不是只有一句“正在思考”。</p>
      </div>
      <div class="inline-tag-row"><span class="micro-pill ${escapeHtml(statusClass(selected?.status || "idle"))}">${escapeHtml(selected ? statusLabel(selected.status) : "等待任务")}</span></div>
    </div>
    <div class="artifact-layout">
      <div class="preview-shell">
        <div class="preview-topbar"><div class="preview-dots"><span class="preview-dot red"></span><span class="preview-dot amber"></span><span class="preview-dot green"></span></div><span class="preview-url">${escapeHtml(projectUrl || "Preview URL will appear here")}</span></div>
        <div class="preview-image-wrap">
          ${previewUrl ? `<img src="${escapeHtml(previewUrl)}" alt="交付预览图" />` : `<div class="preview-placeholder"><div class="preview-wireframe"><span></span><span></span><span></span></div><p>运行预览、截图采样和最终画面会在 Runtime / Verifier 返回后显示在这里。</p></div>`}
        </div>
        <article class="subpanel">
          <div class="subpanel-head"><div><p class="eyebrow">Execution Feed</p><h3 class="subpanel-title">日志片段</h3></div></div>
          <div class="subpanel-body">
            ${timeline.length ? `<div class="log-list">${timeline.map((item) => `<div class="log-item"><span class="log-time">${escapeHtml(formatDateTime(item.time))}</span><div class="log-body"><strong class="log-label">${escapeHtml(item.label)}</strong><span class="log-detail">${escapeHtml(item.detail)}</span></div></div>`).join("")}</div>` : '<div class="log-empty">等待第一条执行日志进入系统。</div>'}
          </div>
        </article>
      </div>
      <div class="artifact-side">
        <article class="subpanel"><div class="subpanel-head"><div><p class="eyebrow">Generated Files</p><h3 class="subpanel-title">生成中的文件树</h3></div><span class="tiny-badge ${escapeHtml(statusClass(getStageStatus(selected, "generator")))}">${escapeHtml(String(safeArray(files).length))}</span></div><div class="subpanel-body"><pre class="tree-block">${escapeHtml(buildTree(files))}</pre></div></article>
        <article class="subpanel"><div class="subpanel-head"><div><p class="eyebrow">README Snapshot</p><h3 class="subpanel-title">README 摘要</h3></div></div><div class="subpanel-body"><pre class="readme-block">${escapeHtml(buildReadmeSnippet(selected))}</pre></div></article>
        <article class="subpanel"><div class="subpanel-head"><div><p class="eyebrow">Quality Gate</p><h3 class="subpanel-title">测试结果摘要</h3></div></div><div class="subpanel-body"><div class="test-grid">${tests.map((test) => `<article class="test-tile"><span class="test-label">${escapeHtml(test.label)}</span><strong class="test-value">${escapeHtml(String(test.value))}</strong><p class="test-note">${escapeHtml(test.note)}</p></article>`).join("")}</div></div></article>
      </div>
    </div>
  `;
}

function renderSystemStatus() {
  const selected = getSelectedTask();
  const latest = state.systemMetrics?.latest;
  const connection = connectionSummary();
  elements.systemStatus.innerHTML = `
    <div class="panel-heading"><p class="eyebrow">System Status</p><h3>当前系统状态</h3><p class="panel-copy">控制台关注的是整个交付引擎是否处在可执行状态，包括队列、任务运行数、资源占用和当前任务态势。</p></div>
    <div class="stat-grid">
      <article class="stat-box"><span class="metric-label">Orchestrator</span><strong class="metric-value">${escapeHtml(selected ? statusLabel(selected.status) : "Ready")}</strong></article>
      <article class="stat-box"><span class="metric-label">Queue Length</span><strong class="metric-value">${escapeHtml(String(latest?.queueLength ?? 0))}</strong></article>
      <article class="stat-box"><span class="metric-label">Running Tasks</span><strong class="metric-value">${escapeHtml(String(latest?.runningTasks ?? 0))}</strong></article>
      <article class="stat-box"><span class="metric-label">Memory Use</span><strong class="metric-value">${escapeHtml(latest ? formatPercent(latest.usedMemRatio) : "--")}</strong></article>
    </div>
    <div class="system-list">
      <article class="system-row"><span class="system-key">模型通道</span><strong class="system-value">${escapeHtml(connection.label)}</strong><span class="route-note">${escapeHtml(connection.detail)}</span></article>
      <article class="system-row"><span class="system-key">当前任务</span><strong class="system-value">${escapeHtml(selected ? taskTitle(selected) : "暂无任务")}</strong><span class="route-note">${escapeHtml(selected ? buildStageSummary(selected, getCurrentStageId(selected)) : "提交新任务后，这里会显示交付主线。")}</span></article>
      <article class="system-row"><span class="system-key">CPU / Workers</span><strong class="system-value">${escapeHtml(latest ? `${latest.cpuCount} cores` : "--")}</strong><span class="route-note">${escapeHtml(latest ? `Task totals: queued ${latest.taskTotals?.queued || 0}, running ${latest.taskTotals?.running || 0}, succeeded ${latest.taskTotals?.succeeded || 0}` : "等待系统采样。")}</span></article>
    </div>
  `;
}

function renderModelStatusPanel() {
  const selected = getSelectedTask();
  const currentStageId = getCurrentStageId(selected);
  const connection = state.modelStatus?.connection;
  elements.modelStatusPanel.innerHTML = `
    <div class="panel-heading"><p class="eyebrow">Model Routing</p><h3>模型调用状态</h3><p class="panel-copy">显示当前工作台的模型接入方式，以及各阶段所采用的路由模型。</p></div>
    <div class="route-list">
      <article class="route-row ${escapeHtml(connectionSummary().statusClass)}"><span class="route-label">Connection Mode</span><strong class="route-value">${escapeHtml(connection?.mode ? humanize(connection.mode) : "Disabled")}</strong><span class="route-note">${escapeHtml(connection?.enabled ? "模型侧可执行" : "当前将回退到确定性流程")}</span></article>
      ${STAGES.map((stage) => {
        const route = getStageRoute(selected, stage.id);
        const status = stage.id === currentStageId ? "running" : getStageStatus(selected, stage.id);
        return `<article class="route-row ${escapeHtml(statusClass(status))}"><span class="route-label">${escapeHtml(stage.system)}</span><strong class="route-value">${escapeHtml(formatRoute(route))}</strong><span class="route-note">${escapeHtml(route?.reason || stage.caption)}</span></article>`;
      }).join("")}
    </div>
  `;
}

function renderCostPanel() {
  const selected = getSelectedTask();
  const costSummary = state.systemMetrics?.latest?.costSummary;
  elements.costPanel.innerHTML = `
    <div class="panel-heading"><p class="eyebrow">Token / Cost</p><h3>token / 成本统计</h3><p class="panel-copy">后端暂未暴露精确 token 账本，这里展示估算成本与调用侧信号，用于体现控制感与预算感知。</p></div>
    <div class="stat-grid">
      <article class="stat-box"><span class="metric-label">Token Est.</span><strong class="metric-value">${escapeHtml(selected ? String(estimateTokens(selected)) : "0")}</strong></article>
      <article class="stat-box"><span class="metric-label">Est. Cost</span><strong class="metric-value">${escapeHtml(formatMoney(selected?.metrics?.estimatedCost || 0))}</strong></article>
      <article class="stat-box"><span class="metric-label">Recent API Calls</span><strong class="metric-value">${escapeHtml(String(costSummary?.apiCalls ?? 0))}</strong></article>
      <article class="stat-box"><span class="metric-label">Avg Latency</span><strong class="metric-value">${escapeHtml(costSummary?.avgLatencyMs != null ? `${costSummary.avgLatencyMs}ms` : "--")}</strong></article>
    </div>
    <div class="system-list"><article class="system-row"><span class="system-key">24h 调用摘要</span><strong class="system-value">${escapeHtml(costSummary ? `${costSummary.recentCalls} calls / ${costSummary.cacheEntries} cache entries` : "等待调用采样")}</strong><span class="route-note">${escapeHtml(costSummary ? `API ${costSummary.apiCalls}, Local ${costSummary.localCalls}` : "当前未收集到最近调用。")}</span></article></div>
  `;
}
function renderRuntimePanel() {
  const selected = getSelectedTask();
  const repairs = getRepairAttempts(selected);
  const runtime = getStageStep(selected, "runner")?.output;
  const currentStage = STAGES.find((stage) => stage.id === getCurrentStageId(selected));
  const runtimeDuration = selected ? formatDurationMs(selected.metrics?.durationMs || (selected.startedAt ? Date.now() - new Date(selected.startedAt).getTime() : 0)) : "--";
  elements.runtimePanel.innerHTML = `
    <div class="panel-heading"><p class="eyebrow">Runtime</p><h3>运行时长 / 错误 / 自动修复</h3><p class="panel-copy">这里用来表达系统的可控性：运行时长、当前节点、错误信息与修复历史都可以被回放。</p></div>
    <div class="stat-grid">
      <article class="stat-box"><span class="metric-label">运行时长</span><strong class="metric-value">${escapeHtml(runtimeDuration)}</strong></article>
      <article class="stat-box"><span class="metric-label">当前节点</span><strong class="metric-value">${escapeHtml(currentStage?.name || "--")}</strong></article>
      <article class="stat-box"><span class="metric-label">修复轮次</span><strong class="metric-value">${escapeHtml(String(repairs.length))}</strong></article>
      <article class="stat-box"><span class="metric-label">预览状态</span><strong class="metric-value">${escapeHtml(runtime?.screenshot?.ok ? "Ready" : "Pending")}</strong></article>
    </div>
    <div class="repair-list">
      ${repairs.length ? repairs.map((repair) => `<article class="repair-item"><div><strong>Repair Attempt ${escapeHtml(String(repair.attempt))}</strong><p class="runtime-note">分数 ${escapeHtml(String(repair.score ?? "--"))} / ${escapeHtml(repair.passed ? "通过" : "继续修复")}</p></div><span class="status-pill ${escapeHtml(repair.passed ? "succeeded" : "running")}">${escapeHtml(repair.passed ? "Recovered" : "Retrying")}</span></article>`).join("") : '<div class="empty-panel">当前没有自动修复记录。若验收失败，Repairer 会在这里显示每一轮回合。</div>'}
    </div>
    ${selected?.error ? `<div class="error-block">${escapeHtml(selected.error)}</div>` : ""}
  `;
}

function buildDeliverableLink(label, href, note) {
  if (!href) return `<span class="deliverable-link disabled"><strong class="deliverable-label">${escapeHtml(label)}</strong><span class="deliverable-note">${escapeHtml(note)}</span></span>`;
  return `<a class="deliverable-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer"><strong class="deliverable-label">${escapeHtml(label)}</strong><span class="deliverable-note">${escapeHtml(note)}</span></a>`;
}

function renderDeliverablePanel() {
  const artifacts = getSelectedTask()?.result?.artifacts;
  elements.deliverablePanel.innerHTML = `
    <div class="panel-heading"><p class="eyebrow">Delivery</p><h3>当前交付物列表</h3><p class="panel-copy">最终预览与导出入口集中放在这里，方便用户明确看到“已经交付了什么”。</p></div>
    <div class="deliverable-list">
      ${buildDeliverableLink("最终预览", artifacts?.projectUrl || artifacts?.previewUrl, artifacts?.projectUrl || "任务完成后可打开最终预览")}
      ${buildDeliverableLink("导出源码包", artifacts?.zipUrl, artifacts?.zipUrl || "压缩包将在 Packager 完成后出现")}
      ${buildDeliverableLink("下载交付报告", artifacts?.reportUrl, artifacts?.reportUrl || "交付报告将在 Packager 完成后出现")}
      ${buildDeliverableLink("查看交付摘要", artifacts?.summaryUrl, artifacts?.summaryUrl || "交付摘要将在 Packager 完成后出现")}
    </div>
  `;
}

function render() {
  buildBrand();
  renderSectionNav();
  renderCurrentProjectList();
  renderHistoryTaskList();
  renderTemplateList();
  renderCommandCenter();
  renderApiOnboarding();
  renderWorkflow();
  renderAgents();
  renderArtifacts();
  renderSystemStatus();
  renderModelStatusPanel();
  renderCostPanel();
  renderRuntimePanel();
  renderDeliverablePanel();
}

function autoResizePrompt(textarea) {
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 360)}px`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}

async function refreshTasks({ preferLatest = false } = {}) {
  const payload = await fetchJson("/api/tasks", { cache: "no-store" });
  state.tasks = sortTasks(payload.tasks || []);
  if (preferLatest && state.tasks[0]) {
    state.selectedTaskId = state.tasks[0].id;
    return;
  }
  if (!state.tasks.some((task) => task.id === state.selectedTaskId)) state.selectedTaskId = state.tasks[0]?.id || null;
}

async function refreshModelStatus() {
  state.modelStatus = await fetchJson("/api/model-status", { cache: "no-store" });
}

async function refreshMetrics() {
  state.systemMetrics = await fetchJson("/api/metrics", { cache: "no-store" });
}

async function fetchSetupGuide() {
  state.setupGuide = await fetchJson("/api/setup-guide", { cache: "no-store" });
  if (!state.setupMode && state.setupGuide?.recommendedMode) {
    state.setupMode = state.setupGuide.recommendedMode;
  }
}

async function refreshAll(options = {}) {
  const results = await Promise.allSettled([refreshTasks(options), refreshModelStatus(), refreshMetrics(), fetchSetupGuide()]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) console.error(failure.reason);
  render();
}
async function createTask() {
  const prompt = state.form.prompt.trim();
  if (!prompt) {
    document.getElementById("command-prompt")?.focus();
    return;
  }
  state.isSubmitting = true;
  renderCommandCenter();
  try {
    const payload = await fetchJson("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        outputType: state.form.outputType,
        framework: state.form.framework,
        style: state.form.style,
        targetPlatform: state.form.targetPlatform,
      }),
    });
    state.form.prompt = "";
    state.selectedTaskId = payload.task.id;
    state.activeSection = "workflow";
    await refreshAll({ preferLatest: true });
    requestAnimationFrame(() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  } catch (error) {
    window.alert(error.message);
  } finally {
    state.isSubmitting = false;
    renderCommandCenter();
  }
}

function applyTemplate(templateId) {
  const template = TEMPLATE_LIBRARY.find((item) => item.id === templateId);
  if (!template) return;
  state.form.prompt = template.prompt;
  state.form.outputType = template.outputType;
  state.form.framework = template.framework;
  state.form.style = template.style;
  state.form.targetPlatform = template.targetPlatform;
  state.activeSection = "command-center";
  render();
  requestAnimationFrame(() => {
    const prompt = document.getElementById("command-prompt");
    prompt?.focus();
    if (prompt) autoResizePrompt(prompt);
  });
}

function handleClick(event) {
  const sectionButton = event.target.closest("[data-scroll-to]");
  if (sectionButton) {
    const targetId = sectionButton.dataset.scrollTo;
    state.activeSection = targetId || "command-center";
    renderSectionNav();
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const taskButton = event.target.closest("[data-select-task]");
  if (taskButton) {
    state.selectedTaskId = taskButton.dataset.selectTask;
    render();
    return;
  }
  const setupModeButton = event.target.closest("[data-setup-mode]");
  if (setupModeButton) {
    state.setupMode = setupModeButton.dataset.setupMode || state.setupMode;
    renderApiOnboarding();
    return;
  }
  const copyButton = event.target.closest("[data-copy-key]");
  if (copyButton) {
    const payload = state.copyPayloads[copyButton.dataset.copyKey || ""];
    if (!payload) return;
    copyText(payload)
      .then(() => {
        const original = copyButton.textContent;
        copyButton.textContent = "已复制";
        window.setTimeout(() => {
          copyButton.textContent = original;
        }, 1400);
      })
      .catch((error) => window.alert(`复制失败: ${error.message}`));
    return;
  }
  const templateButton = event.target.closest("[data-template-id]");
  if (templateButton) {
    applyTemplate(templateButton.dataset.templateId);
    return;
  }
  if (event.target.id === "new-task-button") {
    state.activeSection = "command-center";
    renderSectionNav();
    document.getElementById("command-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => document.getElementById("command-prompt")?.focus());
  }
}

function handleInput(event) {
  if (event.target.id === "command-prompt") {
    state.form.prompt = event.target.value;
    autoResizePrompt(event.target);
  }
}

function handleChange(event) {
  if (event.target.id === "command-output-type") state.form.outputType = event.target.value;
  if (event.target.id === "command-framework") state.form.framework = event.target.value;
  if (event.target.id === "command-style") state.form.style = event.target.value;
  if (event.target.id === "command-platform") state.form.targetPlatform = event.target.value;
}

function handleSubmit(event) {
  if (event.target.id !== "command-form") return;
  event.preventDefault();
  createTask().catch((error) => console.error(error));
}

function attachEventListeners() {
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("submit", handleSubmit);
}

function attachEventStream() {
  if (typeof EventSource === "undefined") {
    window.setInterval(() => refreshAll().catch((error) => console.error(error)), 6000);
    return;
  }
  const stream = new EventSource("/api/events");
  const refresh = () => refreshAll().catch((error) => console.error(error));
  ["task_queued", "task_running", "task_step_running", "task_step_succeeded", "task_step_failed", "task_succeeded", "task_failed"].forEach((eventName) => stream.addEventListener(eventName, refresh));
  stream.addEventListener("connected", refresh);
  stream.addEventListener("error", () => window.setTimeout(refresh, 1200));
}

attachEventListeners();
refreshAll({ preferLatest: true }).catch((error) => {
  console.error(error);
  render();
});
attachEventStream();












