/**
 * 食谱步骤图片提示词生成器 - 独立测试工具
 * 路由: /admin/tools/prompt-generator
 *
 * 功能：
 * 1. 手动输入步骤生成提示词
 * 2. 查看和管理 ImageGenTask 任务列表
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getErrorMessage } from "@/lib/utils";
import {
    ArrowLeft,
    Wand2,
    FileText,
    Copy,
    Loader2,
    ImageIcon,
    ListTodo,
    RefreshCw,
    Play,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    ChevronRight,
    ExternalLink,
} from "lucide-react";

interface StepPrompt {
    stepNumber: number;
    stepType: "preparation" | "cooking" | "presentation";
    coreAction: string;
    prompt: string;
    variables: {
        perspective: string;
        lighting: string;
        surface: string;
        camera: string;
        background: string;
    };
}

interface GeneratedImage {
    imageUrl: string;
    revisedPrompt?: string;
}

// prompts 可能是数组或包含 steps 的对象
type PromptsData = StepPrompt[] | { steps?: StepPrompt[]; sceneContext?: unknown; usedFallback?: boolean } | null;

interface ImageGenTask {
    id: string;
    recipeName: string;
    dishStyle: string;
    status: string;
    steps: Array<{ number: number; description: string; id?: string; action?: string; speechText?: string }>;
    prompts: PromptsData;
    images: Array<{ stepNumber: number; imageUrl?: string; error?: string }> | null;
    // 成品图相关（现在由 AI 在 step 0 返回，只有一张 cover）
    imageShots?: Array<{ key: string; ratio: string; imagePrompt?: string }> | null; // 已废弃，不再使用
    shotPrompts: Array<{ key: string; ratio: string; imagePrompt: string }> | null;
    shotImages: Array<{ key: string; ratio: string; imageUrl?: string; error?: string; imagePrompt?: string }> | null;
    coverImageUrl: string | null;
    // 进度
    totalSteps: number;
    promptsDone: number;
    imagesDone: number;
    totalShots: number;
    shotsDone: number;
    // 其他
    errorMessage: string | null;
    createdAt: string;
    source?: string; // 创建形式
    recipe?: { id: string; slug: string; title?: string } | null;
}

type TabType = "manual" | "tasks";

// 辅助函数：从 prompts 中提取步骤数组（兼容新旧格式）
function getStepPrompts(prompts: PromptsData): StepPrompt[] {
    if (!prompts) return [];
    if (Array.isArray(prompts)) return prompts;
    if (typeof prompts === 'object' && 'steps' in prompts && Array.isArray(prompts.steps)) {
        return prompts.steps;
    }
    return [];
}

export default function PromptGeneratorPage() {
    const [activeTab, setActiveTab] = useState<TabType>("tasks");

    // ========== 手动生成模式 ==========
    const [recipeName, setRecipeName] = useState("");
    const [dishStyle, setDishStyle] = useState<"light_and_fresh" | "dark_and_moody" | "baking">("dark_and_moody");
    const [stepsText, setStepsText] = useState(`1、处理鸡肉
鸡胸肉或鸡腿肉切成约 1.5cm 小丁，加入少许盐、料酒、生抽、淀粉和少量油抓匀，腌 10 分钟。

2、准备配料
干辣椒剪段、葱切段、姜切片、蒜切末、花生米备好。

3、滑炒鸡丁
热锅入油，中火下鸡丁翻炒至变色定型，盛出备用。

4、爆香底料
锅中留底油，小火下花椒、干辣椒炒香，注意不要糊。

5、合炒成菜
倒回鸡丁，加入调好的碗汁，大火快速翻炒 10–15 秒至收汁。

6、收尾出锅
加入花生米和葱段翻匀，关火装盘。`);
    const [isGenerating, setIsGenerating] = useState(false);
    const [prompts, setPrompts] = useState<StepPrompt[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedPrompt, setEditedPrompt] = useState("");
    const [generatingImages, setGeneratingImages] = useState<Set<number>>(new Set());
    const [images, setImages] = useState<Map<number, GeneratedImage>>(new Map());
    const [showMetaPrompt, setShowMetaPrompt] = useState(false);

    // ========== 任务列表模式 ==========
    const [tasks, setTasks] = useState<ImageGenTask[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksTotal, setTasksTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());

    // ========== 编辑和重新生成状态 ==========
    const [editingPromptKey, setEditingPromptKey] = useState<string | null>(null);
    const [editingPromptValue, setEditingPromptValue] = useState("");
    const [editingStepKey, setEditingStepKey] = useState<string | null>(null);
    const [editingStepValue, setEditingStepValue] = useState("");
    const [regeneratingImages, setRegeneratingImages] = useState<Set<string>>(new Set());
    const [savingPrompts, setSavingPrompts] = useState<Set<string>>(new Set());

    // 加载任务列表
    const loadTasks = useCallback(async () => {
        setTasksLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            params.set("limit", "50");

            const res = await fetch(`/api/admin/ai/image-tasks?${params}`);
            const data = await res.json();
            setTasks(data.tasks || []);
            setTasksTotal(data.total || 0);
        } catch (error) {
            console.error("加载任务列表失败:", error);
        } finally {
            setTasksLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        if (activeTab === "tasks") {
            loadTasks();
        }
    }, [activeTab, loadTasks]);

    // 自动刷新运行中的任务
    useEffect(() => {
        if (activeTab !== "tasks") return;

        const hasRunning = tasks.some(t =>
            t.status === "generating_prompts" || t.status === "generating_images"
        );

        if (hasRunning) {
            const timer = setInterval(loadTasks, 3000);
            return () => clearInterval(timer);
        }
    }, [activeTab, tasks, loadTasks]);

    // 瑙ｆ瀽步骤鏂囨湰
    const parseSteps = (text: string) => {
        const lines = text.split("\n").filter(line => line.trim());
        const steps: { number: number; description: string }[] = [];

        for (const line of lines) {
            const match = line.match(/^(\d+)[.銆乗s]+(.*)$/);
            if (match) {
                steps.push({
                    number: parseInt(match[1]),
                    description: match[2].trim(),
                });
            } else if (line.trim() && steps.length > 0) {
                steps[steps.length - 1].description += " " + line.trim();
            }
        }

        return steps;
    };

    // 手动生成提示词
    const handleGeneratePrompts = async () => {
        if (!stepsText.trim()) {
            alert("请输入步骤描述");
            return;
        }

        setIsGenerating(true);
        setPrompts([]);
        setImages(new Map());

        try {
            const steps = parseSteps(stepsText);

            if (steps.length === 0) {
                alert("未能解析到有效步骤");
                return;
            }

            const response = await fetch("/api/admin/ai/generate-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipeName: recipeName || "未命名食谱",
                    dishStyle,
                    steps,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setPrompts(result.data.prompts);
            } else {
                alert(`生成失败: ${result.error}`);
            }
        } catch (error) {
            console.error("生成提示词失败:", error);
            alert("生成失败，请查看控制台");
        } finally {
            setIsGenerating(false);
        }
    };

    // 创建任务（从手动输入）
    const handleCreateTask = async () => {
        if (!stepsText.trim()) {
            alert("请输入步骤描述");
            return;
        }

        const steps = parseSteps(stepsText);
        if (steps.length === 0) {
            alert("未能解析到有效步骤");
            return;
        }

        try {
            const res = await fetch("/api/admin/ai/image-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipeName: recipeName || "未命名食谱",
                    dishStyle,
                    steps,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert("任务已创建");
                setActiveTab("tasks");
                loadTasks();
            } else {
                alert(`创建失败: ${data.error}`);
            }
        } catch (error) {
            console.error("创建任务失败:", error);
            alert("创建任务失败");
        }
    };

    // 执行任务
    const handleExecuteTask = async (taskId: string, action: string) => {
        setExecutingTasks(prev => new Set(prev).add(taskId));

        try {
            const res = await fetch(`/api/admin/ai/image-tasks/${taskId}/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            const data = await res.json();
            if (!data.success && data.error) {
                alert(`执行失败: ${data.error}`);
            }

            // 刷新列表
            setTimeout(loadTasks, 500);
        } catch (error) {
            console.error("执行任务失败:", error);
            alert("执行任务失败");
        } finally {
            setExecutingTasks(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    // 删除任务
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("确定要删除这个任务吗？")) return;

        try {
            await fetch(`/api/admin/ai/image-tasks/${taskId}`, {
                method: "DELETE",
            });
            loadTasks();
        } catch (error) {
            console.error("删除任务失败:", error);
            alert("删除任务失败");
        }
    };

    // 更新提示词
    const handleUpdatePrompt = async (
        taskId: string,
        type: "step" | "shot",
        key: number | string,
        newPrompt: string
    ) => {
        const saveKey = `${taskId}-${type}-${key}`;
        setSavingPrompts(prev => new Set(prev).add(saveKey));

        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            if (type === "step") {
                const prompts = [...getStepPrompts(task.prompts)];
                const idx = prompts.findIndex(p => p.stepNumber === key);
                if (idx >= 0) {
                    prompts[idx] = { ...prompts[idx], prompt: newPrompt };
                }
                await fetch(`/api/admin/ai/image-tasks/${taskId}/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompts }),
                });
            } else {
                const shotPrompts = [...(task.shotPrompts || [])];
                const idx = shotPrompts.findIndex(p => p.key === key);
                if (idx >= 0) {
                    shotPrompts[idx] = { ...shotPrompts[idx], imagePrompt: newPrompt };
                }
                await fetch(`/api/admin/ai/image-tasks/${taskId}/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shotPrompts }),
                });
            }

            setEditingPromptKey(null);
            setEditingPromptValue("");
            loadTasks();
        } catch (error) {
            console.error("更新提示词失败:", error);
            alert("更新提示词失败");
        } finally {
            setSavingPrompts(prev => {
                const next = new Set(prev);
                next.delete(saveKey);
                return next;
            });
        }
    };

    // 更新步骤描述
    const handleUpdateStep = async (
        taskId: string,
        stepNumber: number,
        newDescription: string
    ) => {
        const saveKey = `${taskId}-step-desc-${stepNumber}`;
        setSavingPrompts(prev => new Set(prev).add(saveKey));

        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const steps = [...(task.steps || [])];
            const idx = steps.findIndex(s => s.number === stepNumber);
            if (idx >= 0) {
                steps[idx] = { ...steps[idx], description: newDescription };
            }

            await fetch(`/api/admin/ai/image-tasks/${taskId}/update`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steps }),
            });

            setEditingStepKey(null);
            setEditingStepValue("");
            loadTasks();
        } catch (error) {
            console.error("更新步骤失败:", error);
            alert("更新步骤失败");
        } finally {
            setSavingPrompts(prev => {
                const next = new Set(prev);
                next.delete(saveKey);
                return next;
            });
        }
    };

    // 重新生成图片
    const handleRegenerateImage = async (
        taskId: string,
        type: "step" | "shot",
        key: number | string,
        prompt?: string
    ) => {
        const regenKey = `${taskId}-${type}-${key}`;
        setRegeneratingImages(prev => new Set(prev).add(regenKey));

        try {
            const body: Record<string, unknown> = { type };
            if (type === "step") {
                body.stepNumber = key;
            } else {
                body.shotKey = key;
            }
            if (prompt) {
                body.prompt = prompt;
            }

            const res = await fetch(`/api/admin/ai/image-tasks/${taskId}/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!data.success) {
                alert(`重新生成失败: ${data.error}`);
            }
            loadTasks();
        } catch (error) {
            console.error("重新生成图片失败:", error);
            alert("重新生成图片失败");
        } finally {
            setRegeneratingImages(prev => {
                const next = new Set(prev);
                next.delete(regenKey);
                return next;
            });
        }
    };

    // 生成单张图片（手动模式）
    const handleGenerateImage = async (index: number) => {
        const prompt = prompts[index];
        if (!prompt) return;

        setGeneratingImages(prev => new Set(prev).add(index));

        try {
            const response = await fetch("/api/admin/ai/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: editingIndex === index ? editedPrompt : prompt.prompt,
                    size: "1024x1024",
                    quality: "standard",
                }),
            });

            const result = await response.json();

            if (result.success) {
                setImages(prev => new Map(prev).set(index, result.data));
            } else {
                alert(`图片生成失败: ${result.error}`);
            }
        } catch (error) {
            console.error("生成图片失败:", error);
            alert("图片生成失败，请查看控制台");
        } finally {
            setGeneratingImages(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    };

    // 复制提示词
    const handleCopy = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        alert("已复制到剪贴板");
    };

    // 缂栬緫鐩稿叧
    const startEditing = (index: number, prompt: string) => {
        setEditingIndex(index);
        setEditedPrompt(prompt);
    };

    const saveEdit = (index: number) => {
        if (editedPrompt.trim()) {
            const updated = [...prompts];
            updated[index] = { ...updated[index], prompt: editedPrompt };
            setPrompts(updated);
        }
        setEditingIndex(null);
        setEditedPrompt("");
    };

    // 状态图标
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-600" />;
            case "generating_prompts":
            case "generating_images":
                return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending": return "待执行";
            case "generating_prompts": return "生成提示词中...";
            case "generating_images": return "生成图片中...";
            case "completed": return "已完成";
            case "failed": return "失败";
            default: return status;
        }
    };

    // 获取创建形式文本
    const getSourceText = (source?: string) => {
        switch (source) {
            case "auto_generate": return "菜谱生成";
            case "manual": return "手动创建";
            case "batch": return "批量任务";
            case "import": return "瀵煎叆";
            default: return "菜谱生成";
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin"
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-textGray" />
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-medium text-textDark">
                        食谱步骤图片提示词生成器
                    </h1>
                    <p className="text-sm text-textGray mt-1">
                        管理图片生成任务，或手动输入步骤生成提示词
                    </p>
                </div>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-2 border-b border-cream">
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "tasks"
                        ? "text-brownDark border-b-2 border-brownDark"
                        : "text-textGray hover:text-textDark"
                        }`}
                >
                    <ListTodo className="h-4 w-4 inline-block mr-1" />
                    任务列表 ({tasksTotal})
                </button>
                <button
                    onClick={() => setActiveTab("manual")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "manual"
                        ? "text-brownDark border-b-2 border-brownDark"
                        : "text-textGray hover:text-textDark"
                        }`}
                >
                    <Wand2 className="h-4 w-4 inline-block mr-1" />
                    手动生成
                </button>
            </div>

            {/* ========== 任务列表模式 ========== */}
            {activeTab === "tasks" && (
                <div className="space-y-4">
                    {/* 筛选和刷新 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 border border-cream rounded-lg text-sm"
                            >
                                <option value="">全部状态</option>
                                <option value="pending">待执行</option>
                                <option value="generating_prompts">生成提示词中</option>
                                <option value="generating_images">生成图片中</option>
                                <option value="completed">已完成</option>
                                <option value="failed">失败</option>
                            </select>
                        </div>
                        <button
                            onClick={loadTasks}
                            disabled={tasksLoading}
                            className="px-3 py-1.5 text-sm border border-cream rounded-lg hover:bg-cream flex items-center gap-1"
                        >
                            <RefreshCw className={`h-4 w-4 ${tasksLoading ? "animate-spin" : ""}`} />
                            刷新
                        </button>
                    </div>

                    {/* 任务列表 */}
                    {tasksLoading && tasks.length === 0 ? (
                        <div className="text-center py-12 text-textGray">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            加载中...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 text-textGray">
                            暂无任务，可以在「手动生成」中创建新任务
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => {
                                const taskErrorText = getErrorMessage(task.errorMessage, "");

                                return (
                                    <div
                                        key={task.id}
                                        className="bg-white border border-cream rounded-lg overflow-hidden"
                                    >
                                    {/* 任务头部 */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-cream/30 transition-colors"
                                        onClick={() => setExpandedTaskId(
                                            expandedTaskId === task.id ? null : task.id
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedTaskId === task.id ? (
                                                    <ChevronDown className="h-4 w-4 text-textGray" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-textGray" />
                                                )}
                                                {getStatusIcon(task.status)}
                                                <div>
                                                    <span className="font-medium text-textDark">
                                                        {task.recipeName}
                                                    </span>
                                                    <span className="ml-2 text-xs text-textGray">
                                                        {new Date(task.createdAt).toLocaleString("zh-CN")}
                                                    </span>
                                                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-cream text-textGray rounded">
                                                        {getSourceText(task.source)}
                                                    </span>
                                                    {task.recipe && (
                                                        <Link
                                                            href={`/admin/recipes/${task.recipe.id}/edit`}
                                                            className="ml-2 text-xs text-brownWarm hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="h-3 w-3 inline" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-textGray">
                                                <span>{getStatusText(task.status)}</span>
                                                <span title="步骤图">
                                                    {task.imagesDone}/{task.totalSteps} 步骤图
                                                </span>
                                                {task.totalShots > 0 && (
                                                    <span title="成品图">
                                                        {task.shotsDone}/{task.totalShots} 成品图
                                                    </span>
                                                )}
                                                <span className="text-xs">
                                                    {new Date(task.createdAt).toLocaleString("zh-CN")}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 进度条*/}
                                        {(task.status === "generating_prompts" || task.status === "generating_images") && (
                                            <div className="mt-2 h-1.5 bg-cream rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brownWarm transition-all"
                                                    style={{
                                                        width: `${Math.round(
                                                            ((task.promptsDone + task.imagesDone + task.shotsDone) /
                                                                ((task.totalSteps + task.totalShots) * 2)) * 100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 灞曞紑璇︽儏 */}
                                    {expandedTaskId === task.id && (
                                        <div className="border-t border-cream p-4 space-y-4 bg-cream/10">
                                            {/* 鎿嶄綔鎸夐挳 */}
                                            <div className="flex gap-2 flex-wrap">
                                                {task.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleExecuteTask(task.id, "prompts")}
                                                            disabled={executingTasks.has(task.id)}
                                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <Play className="h-3 w-3" />
                                                            生成提示词
                                                        </button>
                                                        <button
                                                            onClick={() => handleExecuteTask(task.id, "full")}
                                                            disabled={executingTasks.has(task.id)}
                                                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <Play className="h-3 w-3" />
                                                            完整执行
                                                        </button>
                                                    </>
                                                )}
                                                {task.status === "pending" && getStepPrompts(task.prompts).length > 0 && (
                                                    <button
                                                        onClick={() => handleExecuteTask(task.id, "images")}
                                                        disabled={executingTasks.has(task.id)}
                                                        className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <ImageIcon className="h-3 w-3" />
                                                        生成图片
                                                    </button>
                                                )}
                                                {task.status === "failed" && (
                                                    <button
                                                        onClick={() => handleExecuteTask(task.id, "retry")}
                                                        disabled={executingTasks.has(task.id)}
                                                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <RefreshCw className="h-3 w-3" />
                                                        重试失败
                                                    </button>
                                                )}
                                                {task.status === "completed" && task.recipe && (
                                                    <button
                                                        onClick={() => handleExecuteTask(task.id, "apply")}
                                                        disabled={executingTasks.has(task.id)}
                                                        className="px-3 py-1.5 text-sm bg-brownDark text-white rounded hover:bg-brownDark/90 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="h-3 w-3" />
                                                        应用到食谱
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    删除
                                                </button>
                                            </div>

                                            {/* 閿欒淇℃伅 */}
                                            {taskErrorText && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                    {taskErrorText}
                                                </div>
                                            )}

                                            {/* 提示词列表*/}
                                            {getStepPrompts(task.prompts).length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-textDark">
                                                    {task.imagesDone}/{task.totalSteps} 步骤图
                                                    </h4>
                                                    <div className="space-y-3">
                                                {getStepPrompts(task.prompts).map((p, idx) => {
                                                    const img = task.images?.find(
                                                        i => i.stepNumber === p.stepNumber
                                                    );
                                                    const step = task.steps?.find(
                                                        s => s.number === p.stepNumber ||
                                                             s.id === `step${String(p.stepNumber).padStart(2, '0')}`
                                                    );
                                                    // 兼容 RecipeStep 的多种描述字段
                                                    const stepDescription = step?.description || step?.action || step?.speechText;
                                                    const imgErrorText = getErrorMessage(img?.error, "");
                                                    const isEditingPrompt = editingPromptKey === `${task.id}-step-${p.stepNumber}`;
                                                    const isEditingStep = editingStepKey === `${task.id}-step-desc-${p.stepNumber}`;
                                                    const isRegenerating = regeneratingImages.has(`${task.id}-step-${p.stepNumber}`);
                                                    const isSavingPrompt = savingPrompts.has(`${task.id}-step-${p.stepNumber}`);
                                                    const isSavingStep = savingPrompts.has(`${task.id}-step-desc-${p.stepNumber}`);

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="p-4 bg-white border border-cream rounded-lg text-sm"
                                                                >
                                                                    {/* 图片预览 - 大尺寸 */}
                                                                    <div className="mb-4">
                                                                        <div className="relative w-full max-w-lg aspect-[4/3] rounded-lg overflow-hidden border border-cream bg-cream/30">
                                                                            {img?.imageUrl ? (
                                                                                <Image
                                                                                    src={img.imageUrl}
                                                                                    alt={`步骤 ${p.stepNumber}`}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                    <ImageIcon className="h-12 w-12 text-textGray/30" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {/* 步骤头部 */}
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-medium text-brownDark">
                                                                                步骤 {p.stepNumber}
                                                                            </span>
                                                                            <span className="text-xs px-1.5 py-0.5 bg-cream rounded">
                                                                                {p.stepType}
                                                                            </span>
                                                                            {imgErrorText && (
                                                                                <span className="text-xs text-red-600">
                                                                                    图片失败: {imgErrorText}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* 步骤描述 */}
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs text-textGray font-medium">步骤描述:</div>
                                                                            {isEditingStep ? (
                                                                                <div className="space-y-2">
                                                                                    <textarea
                                                                                        value={editingStepValue}
                                                                                        onChange={(e) => setEditingStepValue(e.target.value)}
                                                                                        rows={2}
                                                                                        className="w-full px-2 py-1 border border-brownWarm rounded text-sm"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleUpdateStep(task.id, p.stepNumber, editingStepValue)}
                                                                                            disabled={isSavingStep}
                                                                                            className="px-2 py-1 text-xs bg-brownDark text-white rounded hover:bg-brownDark/90 disabled:opacity-50"
                                                                                        >
                                                                                            {isSavingStep ? "淇濆瓨涓?.." : "淇濆瓨"}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => { setEditingStepKey(null); setEditingStepValue(""); }}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                        >
                                                                                            取消
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-start gap-2">
                                                                                    <p className="text-textDark text-xs flex-1">
                                                                                        {stepDescription || p.coreAction || "无描述"}
                                                                                    </p>
                                                                                    {stepDescription && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingStepKey(`${task.id}-step-desc-${p.stepNumber}`);
                                                                                                setEditingStepValue(stepDescription);
                                                                                            }}
                                                                                            className="flex-shrink-0 text-xs text-brownWarm hover:text-brownDark"
                                                                                        >
                                                                                            缂栬緫
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* 提示词*/}
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs text-textGray font-medium">提示词</div>
                                                                            {isEditingPrompt ? (
                                                                                <div className="space-y-2">
                                                                                    <textarea
                                                                                        value={editingPromptValue}
                                                                                        onChange={(e) => setEditingPromptValue(e.target.value)}
                                                                                        rows={4}
                                                                                        className="w-full px-2 py-1 border border-brownWarm rounded text-xs font-mono"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleUpdatePrompt(task.id, "step", p.stepNumber, editingPromptValue)}
                                                                                            disabled={isSavingPrompt}
                                                                                            className="px-2 py-1 text-xs bg-brownDark text-white rounded hover:bg-brownDark/90 disabled:opacity-50"
                                                                                        >
                                                                                            {isSavingPrompt ? "淇濆瓨涓?.." : "淇濆瓨"}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => { setEditingPromptKey(null); setEditingPromptValue(""); }}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                        >
                                                                                            取消
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    <pre className="text-xs bg-cream/30 p-2 rounded whitespace-pre-wrap font-mono text-textGray">
                                                                                        {p.prompt}
                                                                                    </pre>
                                                                                    <div className="flex gap-2 flex-wrap">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingPromptKey(`${task.id}-step-${p.stepNumber}`);
                                                                                                setEditingPromptValue(p.prompt);
                                                                                            }}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                        >
                                                                                            缂栬緫
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleCopy(p.prompt)}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream flex items-center gap-1"
                                                                                        >
                                                                                            <Copy className="h-3 w-3" /> 复制
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleRegenerateImage(task.id, "step", p.stepNumber)}
                                                                                            disabled={isRegenerating}
                                                                                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                                                                        >
                                                                                            {isRegenerating ? (
                                                                                                <><Loader2 className="h-3 w-3 animate-spin" /> 生成中...</>
                                                                                            ) : (
                                                                                                <><RefreshCw className="h-3 w-3" /> 重新生成</>
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 成品图列表*/}
                                            {((task.shotPrompts && task.shotPrompts.length > 0) || (task.shotImages && task.shotImages.length > 0)) && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-textDark">
                                                        {task.shotsDone}/{task.totalShots} 成品图
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {(task.shotPrompts || task.shotImages || []).map((shot, idx) => {
                                                            const img = task.shotImages?.find(i => i.key === shot.key);
                                                            const shotPrompt = task.shotPrompts?.find(p => p.key === shot.key);
                                                            const shotErrorText = getErrorMessage(img?.error, "");
                                                            const isCompleted = img?.imageUrl && !shotErrorText;
                                                            const isFailed = !!shotErrorText;
                                                            const isEditingPrompt = editingPromptKey === `${task.id}-shot-${shot.key}`;
                                                            const isRegenerating = regeneratingImages.has(`${task.id}-shot-${shot.key}`);
                                                            const isSavingPrompt = savingPrompts.has(`${task.id}-shot-${shot.key}`);

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`p-4 bg-white border rounded-lg text-sm ${isCompleted ? 'border-green-200' :
                                                                        isFailed ? 'border-red-200' : 'border-cream'
                                                                        }`}
                                                                >
                                                                    {/* 图片预览 - 大尺寸 */}
                                                                    <div className="mb-4">
                                                                        <div className="relative w-full max-w-lg aspect-video rounded-lg overflow-hidden border border-cream bg-cream/30">
                                                                            {img?.imageUrl ? (
                                                                                <Image
                                                                                    src={img.imageUrl}
                                                                                    alt={shot.key}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                    <ImageIcon className="h-12 w-12 text-textGray/30" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {/* 头部信息 */}
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-medium text-brownDark">{shot.key}</span>
                                                                            <span className="text-xs text-textGray">({shot.ratio})</span>
                                                                            {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                                            {isFailed && (
                                                                                <span className="text-xs text-red-600">
                                                                                    失败: {shotErrorText}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* 提示词*/}
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs text-textGray font-medium">提示词</div>
                                                                            {isEditingPrompt ? (
                                                                                <div className="space-y-2">
                                                                                    <textarea
                                                                                        value={editingPromptValue}
                                                                                        onChange={(e) => setEditingPromptValue(e.target.value)}
                                                                                        rows={4}
                                                                                        className="w-full px-2 py-1 border border-brownWarm rounded text-xs font-mono"
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleUpdatePrompt(task.id, "shot", shot.key, editingPromptValue)}
                                                                                            disabled={isSavingPrompt}
                                                                                            className="px-2 py-1 text-xs bg-brownDark text-white rounded hover:bg-brownDark/90 disabled:opacity-50"
                                                                                        >
                                                                                            {isSavingPrompt ? "淇濆瓨涓?.." : "淇濆瓨"}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => { setEditingPromptKey(null); setEditingPromptValue(""); }}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                        >
                                                                                            取消
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    <pre className="text-xs bg-cream/30 p-2 rounded whitespace-pre-wrap font-mono text-textGray">
                                                                                        {shotPrompt?.imagePrompt || img?.imagePrompt || "无提示词"}
                                                                                    </pre>
                                                                                    <div className="flex gap-2 flex-wrap">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingPromptKey(`${task.id}-shot-${shot.key}`);
                                                                                                setEditingPromptValue(shotPrompt?.imagePrompt || img?.imagePrompt || "");
                                                                                            }}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                        >
                                                                                            缂栬緫
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleCopy(shotPrompt?.imagePrompt || img?.imagePrompt || "")}
                                                                                            className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream flex items-center gap-1"
                                                                                        >
                                                                                            <Copy className="h-3 w-3" /> 复制
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleRegenerateImage(task.id, "shot", shot.key)}
                                                                                            disabled={isRegenerating}
                                                                                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                                                                        >
                                                                                            {isRegenerating ? (
                                                                                                <><Loader2 className="h-3 w-3 animate-spin" /> 生成中...</>
                                                                                            ) : (
                                                                                                <><RefreshCw className="h-3 w-3" /> 重新生成</>
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 灏侀潰鍥鹃瑙?*/}
                                            {task.coverImageUrl && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-textDark">
                                                        封面图
                                                    </h4>
                                                    <div className="p-4 bg-white border-2 border-brownWarm rounded-lg">
                                                        <div className="flex items-start gap-4">
                                                            <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-cream flex-shrink-0">
                                                                <Image
                                                                    src={task.coverImageUrl}
                                                                    alt="封面图"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-2">
                                                                {/* 找到封面图对应的提示词 */}
                                                                {(() => {
                                                                    const coverShot = task.shotImages?.find(s => s.imageUrl === task.coverImageUrl);
                                                                    const coverPrompt = coverShot ? task.shotPrompts?.find(p => p.key === coverShot.key) : null;
                                                                    const isEditingCover = editingPromptKey === `${task.id}-cover`;
                                                                    const isRegeneratingCover = coverShot && regeneratingImages.has(`${task.id}-shot-${coverShot.key}`);
                                                                    const isSavingCover = coverShot && savingPrompts.has(`${task.id}-shot-${coverShot.key}`);

                                                                    return (
                                                                        <>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs text-textGray">
                                                                                    绫诲瀷: {coverShot?.key || "鏈煡"}
                                                                                </span>
                                                                                <span className="text-xs text-textGray">
                                                                                    姣斾緥: {coverShot?.ratio || "鏈煡"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="text-xs text-textGray font-medium">提示词</div>
                                                                                {isEditingCover ? (
                                                                                    <div className="space-y-2">
                                                                                        <textarea
                                                                                            value={editingPromptValue}
                                                                                            onChange={(e) => setEditingPromptValue(e.target.value)}
                                                                                            rows={4}
                                                                                            className="w-full px-2 py-1 border border-brownWarm rounded text-xs font-mono"
                                                                                        />
                                                                                        <div className="flex gap-2">
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    if (coverShot) {
                                                                                                        handleUpdatePrompt(task.id, "shot", coverShot.key, editingPromptValue);
                                                                                                    }
                                                                                                }}
                                                                                                disabled={isSavingCover}
                                                                                                className="px-2 py-1 text-xs bg-brownDark text-white rounded hover:bg-brownDark/90 disabled:opacity-50"
                                                                                            >
                                                                                                {isSavingCover ? "淇濆瓨涓?.." : "淇濆瓨"}
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => { setEditingPromptKey(null); setEditingPromptValue(""); }}
                                                                                                className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                            >
                                                                                                取消
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="space-y-2">
                                                                                        <pre className="text-xs bg-cream/30 p-2 rounded whitespace-pre-wrap font-mono text-textGray">
                                                                                            {coverPrompt?.imagePrompt || coverShot?.imagePrompt || "无提示词"}
                                                                                        </pre>
                                                                                        <div className="flex gap-2 flex-wrap">
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setEditingPromptKey(`${task.id}-cover`);
                                                                                                    setEditingPromptValue(coverPrompt?.imagePrompt || coverShot?.imagePrompt || "");
                                                                                                }}
                                                                                                className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream"
                                                                                            >
                                                                                                缂栬緫
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleCopy(coverPrompt?.imagePrompt || coverShot?.imagePrompt || "")}
                                                                                                className="px-2 py-1 text-xs border border-cream rounded hover:bg-cream flex items-center gap-1"
                                                                                            >
                                                                                                <Copy className="h-3 w-3" /> 复制
                                                                                            </button>
                                                                                            {coverShot && (
                                                                                                <button
                                                                                                    onClick={() => handleRegenerateImage(task.id, "shot", coverShot.key)}
                                                                                                    disabled={isRegeneratingCover}
                                                                                                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                                                                                >
                                                                                                    {isRegeneratingCover ? (
                                                                                                        <><Loader2 className="h-3 w-3 animate-spin" /> 生成中...</>
                                                                                                    ) : (
                                                                                                        <><RefreshCw className="h-3 w-3" /> 重新生成</>
                                                                                                    )}
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    )
                    }
                </div>
            )}


            {/* ========== 手动生成模式 ========== */}
            {
                activeTab === "manual" && (
                    <>
                        {/* 输入区域 */}
                        <div className="bg-white rounded-xl border border-cream p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-brownWarm" />
                                <h2 className="text-lg font-medium text-textDark">食谱信息</h2>
                            </div>

                            {/* 食谱名称 */}
                            <div>
                                <label className="block text-sm font-medium text-textDark mb-2">
                                    菜名（可选）
                                </label>
                                <input
                                    type="text"
                                    value={recipeName}
                                    onChange={(e) => setRecipeName(e.target.value)}
                                    placeholder="例如：宫保鸡丁"
                                    className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm"
                                />
                            </div>

                            {/* 风格选择 */}
                            <div>
                                <label className="block text-sm font-medium text-textDark mb-2">
                                    菜品风格
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="light_and_fresh"
                                            checked={dishStyle === "light_and_fresh"}
                                            onChange={(e) => setDishStyle(e.target.value as typeof dishStyle)}
                                            className="text-brownWarm"
                                        />
                                        <span className="text-sm text-textDark">娓呮贰</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="dark_and_moody"
                                            checked={dishStyle === "dark_and_moody"}
                                            onChange={(e) => setDishStyle(e.target.value as typeof dishStyle)}
                                            className="text-brownWarm"
                                        />
                                        <span className="text-sm text-textDark">娴撻儊</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="baking"
                                            checked={dishStyle === "baking"}
                                            onChange={(e) => setDishStyle(e.target.value as typeof dishStyle)}
                                            className="text-brownWarm"
                                        />
                                        <span className="text-sm text-textDark">鐑樼剻</span>
                                    </label>
                                </div>
                            </div>

                            {/* 步骤输入 */}
                            <div>
                                <label className="block text-sm font-medium text-textDark mb-2">
                                    步骤列表（每行一个步骤，可以用序号，也可以不用）
                                </label>
                                <textarea
                                    value={stepsText}
                                    onChange={(e) => setStepsText(e.target.value)}
                                    placeholder={`渚嬪锛?
1. 将鸡肉切成1.5cm的丁，用料酒和淀粉腌制
2. 鐑攨涓嬫补锛屽€掑叆楦′竵婊戠倰鑷冲彉鑹?
3. 加入干辣椒和花椒炒香
4. 调入宫保汁，大火翻炒均匀即可`}
                                    rows={8}
                                    className="w-full px-4 py-2 border border-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm font-mono text-sm"
                                />
                            </div>

                            {/* 鎿嶄綔鎸夐挳 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGeneratePrompts}
                                    disabled={isGenerating || !stepsText.trim()}
                                    className="flex-1 px-6 py-3 bg-brownDark text-white rounded-lg hover:bg-brownDark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            生成中...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-5 w-5" />
                                            生成提示词
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!stepsText.trim()}
                                    className="px-6 py-3 border border-brownDark text-brownDark rounded-lg hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                >
                                    <ListTodo className="h-5 w-5" />
                                    创建任务
                                </button>
                            </div>
                        </div>

                        {/* 鍏冩彁绀鸿瘝妯℃澘鏄剧ず */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">馃</span>
                                    <h2 className="text-lg font-medium text-textDark">鍏冩彁绀鸿瘝妯℃澘</h2>
                                </div>
                                <button
                                    onClick={() => setShowMetaPrompt(!showMetaPrompt)}
                                    className="text-sm text-brownWarm hover:text-brownDark transition-colors"
                                >
                                    {showMetaPrompt ? "闅愯棌" : "鏄剧ず"}
                                </button>
                            </div>
                            <p className="text-sm text-textGray mb-3">
                                以下是 AI 生成图片提示词时使用的基础模板，系统会根据每个步骤的特点动态填充变量
                            </p>
                            {showMetaPrompt && (
                                <div className="bg-white rounded-lg p-4 border border-purple-100">
                                    <pre className="text-xs font-mono text-textDark whitespace-pre-wrap leading-relaxed">
                                        {`A realistic and detailed food photography, professional color grading, {{camera}}.
{{perspective}} of {{coreAction}}.
The scene is set {{surface}}, with {{background}}.
The lighting is {{lighting}}, casting soft shadows and highlighting the texture of the food.
High detail, sharp focus on the main action, with a slight bokeh background.

--no illustration, 3d render, cartoon, watermark, text, logo, oversaturated, artificial, fake`}
                                    </pre>
                                    <div className="mt-4 space-y-2 text-xs text-textGray">
                                        <p><strong>变量说明：</strong></p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}{"}coreAction{"}{"}"}</code> - 核心烹饪动作（由 AI 翻译为英文）</li>
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}perspective{"}}"}</code> - 瑙嗚锛堜粠渚ч潰銆佷粠45掳銆佷粠涓婃柟绛夛級</li>
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}{"}lighting{"}{"}"}</code> - 光线效果（自然光、温暖光等）</li>
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}surface{"}}"}</code> - 琛ㄩ潰鏉愯川锛堟湪妗屻€佺煶闈㈢瓑锛?</li>
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}{"}camera{"}{"}"}</code> - 相机设置（景深、分辨率等）</li>
                                            <li><code className="px-1 py-0.5 bg-purple-50 rounded text-purple-700">{"{{"}{"}background{"}{"}"}</code> - 背景描述</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 缁撴灉灞曠ず */}
                        {prompts.length > 0 && (
                            <div className="bg-white rounded-xl border border-cream p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-medium text-textDark">生成结果</h2>
                                        <p className="text-sm text-textGray mt-1">
                                            鍏?{prompts.length} 涓楠?
                                        </p>
                                    </div>
                                </div>

                                {/* 步骤鍗＄墖 */}
                                <div className="space-y-4">
                                    {prompts.map((prompt, index) => (
                                        <div
                                            key={index}
                                            className="border border-cream rounded-lg p-4 space-y-3"
                                        >
                                            {/* 步骤头部 */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-brownDark">
                                                        步骤 {prompt.stepNumber}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-cream rounded text-textGray">
                                                        {prompt.stepType === "preparation" && "鍑嗗闃舵"}
                                                        {prompt.stepType === "cooking" && "鐑归オ闃舵"}
                                                        {prompt.stepType === "presentation" && "鎽嗙洏闃舵"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 核心动作 */}
                                            <div className="text-sm text-textGray">
                                                <strong>核心动作:</strong> {prompt.coreAction}
                                            </div>

                                            {/* 提示词*/}
                                            <div>
                                                {editingIndex === index ? (
                                                    <textarea
                                                        value={editedPrompt}
                                                        onChange={(e) => setEditedPrompt(e.target.value)}
                                                        rows={6}
                                                        className="w-full px-3 py-2 border border-brownWarm rounded text-sm font-mono"
                                                    />
                                                ) : (
                                                    <pre className="text-xs bg-cream/30 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                                                        {prompt.prompt}
                                                    </pre>
                                                )}
                                            </div>

                                            {/* 鎿嶄綔鎸夐挳 */}
                                            <div className="flex gap-2">
                                                {editingIndex === index ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(index)}
                                                            className="px-3 py-1 text-sm bg-brownDark text-white rounded hover:bg-brownDark/90"
                                                        >
                                                            淇濆瓨
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingIndex(null)}
                                                            className="px-3 py-1 text-sm border border-cream rounded hover:bg-cream"
                                                        >
                                                            取消
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(index, prompt.prompt)}
                                                            className="px-3 py-1 text-sm border border-cream rounded hover:bg-cream flex items-center gap-1"
                                                        >
                                                            鉁忥笍 缂栬緫
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopy(prompt.prompt)}
                                                            className="px-3 py-1 text-sm border border-cream rounded hover:bg-cream flex items-center gap-1"
                                                        >
                                                            <Copy className="h-3 w-3" /> 复制
                                                        </button>
                                                        <button
                                                            onClick={() => handleGenerateImage(index)}
                                                            disabled={generatingImages.has(index)}
                                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                        >
                                                            {generatingImages.has(index) ? (
                                                                <>
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                    生成中...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ImageIcon className="h-3 w-3" />
                                                                    生成图片
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* 图片预览 */}
                                            {images.has(index) && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-sm font-medium text-textDark">生成的图片：</p>
                                                    <div className="relative w-full aspect-square max-w-md rounded-lg overflow-hidden border border-cream">
                                                        <Image
                                                            src={images.get(index)!.imageUrl}
                                                            alt={`步骤 ${prompt.stepNumber} 图片`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    {images.get(index)?.revisedPrompt && (
                                                        <details className="text-xs text-textGray">
                                                            <summary className="cursor-pointer hover:text-textDark">
                                                                查看 DALL-E 修正后的提示词
                                                            </summary>
                                                            <p className="mt-2 p-2 bg-cream/30 rounded">
                                                                {images.get(index)!.revisedPrompt}
                                                            </p>
                                                        </details>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )
            }
        </div>
    );
}
