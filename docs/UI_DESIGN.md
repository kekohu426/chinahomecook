# 食谱详情页 UI 设计文档

> 基于 PRD 设计稿的完整理解和实现规范

---

## 📱 整体布局（桌面端）

```
┌─────────────────────────────────────────────────────────┐
│  [RECIPE ZEN Logo]              [🎧]  [🔍]              │ ← 顶部导航
├─────────────────────────────────────────────────────────┤
│                                                         │
│           ███████████████████████████████               │
│           █                             █               │
│           █   头部大图（渐变遮罩）        █               │ ← 沉浸式头部
│           █                             █               │
│           ███████████████████████████████               │
│                                                         │
│           BRAISED DUCK IN BEER • 湘菜风味                │ ← 英文标签
│           啤酒鸭                                         │ ← 大标题
│           │"麦香与肉脂的微醺共舞..."                     │ ← 治愈文案（左侧竖线）
│                                                         │
│     ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│     │ 🔥        │  │ ⏱️        │  │ 🌾        │        │ ← 信息卡片
│     │难度系数   │  │预计耗时   │  │卡路里     │        │
│     │  中等     │  │  60分     │  │~450kcal   │        │
│     └───────────┘  └───────────┘  └───────────┘        │
│                                                         │
├──────────┬──────────────────────────────────────────────┤
│          │  🪶 厨房里的微醺奇遇                          │ ← 文化故事
│          │  ┌────────────────────────────────────────┐  │
│ 食材清单 │  │ 啤酒鸭是一道充满江湖气的菜肴...         │  │
│          │  └────────────────────────────────────────┘  │
│ 模式:生活化│                                             │
│          │  制作步骤              🍳 COOKING IN PROGRESS │ ← 步骤区
│ [2人][3人]│                                             │
│   [6人]  │  ┌─ STEP 01 ────────────────────────────┐   │
│          │  │                                      │   │
│ 主料 MAIN │  │  冷水焯鸭去腥                         │   │
│          │  │                                      │   │
│ 🍖 鸭肉   │  │  [配图：炸鸭块]                       │   │
│   (半只)  │  │                                      │   │
│  750G    │  │  鸭肉切块冷水下锅，放入两片姜和少许料酒  │   │
│          │  │  大火煮开后撇去浮沫，煮2分钟捞出。     │   │
│ 🍺 啤酒   │  │                                      │   │
│  500ML   │  │  ✍️ 状态检查：水面浮起大量灰色浮沫...  │   │
│          │  │                                      │   │
│ 配料      │  │  ⏱️ 开启冷水焯鸭去腥计时 (2分钟)      │   │
│ SPICES   │  │                                      │   │
│          │  └──────────────────────────────────────┘   │
│ 🌶️ 青红椒 │                                             │
│   2个    │  ┌─ STEP 02 ───────────────────────────┐   │
│          │  │                                      │   │
│ 🧅 姜片   │  │  煸炒出鸭油            🔥 关键步骤     │   │
│   15G    │  │  ...                                 │   │
│          │  └──────────────────────────────────────┘   │
│ 🫒 生抽   │                                             │
│  30ML    │  ... 更多步骤 ...                           │
│          │                                             │
│ (固定侧栏)│                                             │
└──────────┴─────────────────────────────────────────────┘
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🔧 AI 智能主厨                                   │  │ ← AI助手
│  │  "我是你的数字主厨。关于这道《啤酒鸭》，有任何问题..." │
│  │  [输入框: 例如：没放啤酒可以用白酒代替吗？]          │
│  │  [咨询主厨]                                       │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [🔗 SHARE]  [🖨️ PRINT]         [▶️ COOK NOW]          │ ← 底部工具栏
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 "点开就能照做" 全屏模式（COOK NOW）

```
┌─────────────────────────────────────────────────────────┐
│  [✕]                                                    │ ← 退出按钮
│                                                         │
│         ┌───────────────────────────────────┐          │
│         │                                   │          │
│         │                                   │          │
│         │      步骤配图（大图）              │          │ ← 全屏图片
│         │                                   │          │
│         │                                   │          │
│         └───────────────────────────────────┘          │
│                                                         │
│                  冷水焯鸭去腥                            │ ← 超大标题
│                                                         │
│     鸭肉切块冷水下锅，放入两片姜和少许料酒。              │
│     大火煮开后撇去浮沫，煮2分钟捞出。                    │ ← 白色文字
│                                                         │
│     ╔═════════════════════════════════════════╗        │
│     ║ 状态检查：水面浮起大量灰色浮沫，鸭肉变  ║        │ ← 状态检查
│     ║ 色发白。                                ║        │   （半透明框）
│     ╚═════════════════════════════════════════╝        │
│                                                         │
│              [⏱️ 开启冷水焯鸭去腾计时 (2分钟)]           │ ← 计时器按钮
│                                                         │
│                                                         │
│  [◀️]         ⚪ ⚫ ⚪ ⚪ ⚪                    [▶️]       │ ← 导航
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**计时器运行状态**：
```
[⏰ 计时运行中]  ← 按钮变为带边框的样式
```

---

## 🚨 **重要约束：样式必须100%还原设计稿！**

**严格要求**：
- ✅ 所有颜色、圆角、间距必须精确匹配设计稿
- ✅ 不能使用"相近"的颜色或尺寸
- ✅ 开发时对照 `docs/prd-images/` 逐像素检查
- ✅ 字体大小、行高、间距必须一致
- ✅ 布局结构完全一致

**验收标准**：设计稿与实现放在一起，用户看不出差异

---

## 🎨 设计规范

### 1. 配色方案

```css
/* 主色调 */
--cream: #F5F1E8;           /* 奶油白（主背景） */
--warm-brown: #8B6F47;      /* 暖棕色（主要按钮、标签） */
--dark-brown: #5C4A37;      /* 深棕色（COOK NOW按钮、AI卡片背景） */

/* 辅助色 */
--light-gray: #F8F8F8;      /* 浅灰（卡片背景） */
--text-gray: #666666;       /* 文字灰 */
--text-dark: #333333;       /* 深色文字 */
--accent-orange: #E8A87C;   /* 强调橙（状态检查图标） */

/* 全屏模式 */
--fullscreen-bg: #1A1A1A;   /* 黑色背景 */
--fullscreen-text: #FFFFFF; /* 白色文字 */
```

### 2. 字体规范

```css
/* 标题 */
font-family: 'Noto Serif SC', Georgia, serif; /* 衬线体 */
font-weight: 500;

/* 正文 */
font-family: 'Inter', 'PingFang SC', sans-serif; /* 无衬线体 */
font-weight: 400;

/* 字号 */
--title-lg: 48px;    /* 大标题（啤酒鸭） */
--title-md: 24px;    /* 步骤标题 */
--text-base: 16px;   /* 正文 */
--text-sm: 14px;     /* 小字 */
```

### 3. 圆角和阴影

```css
/* 圆角 */
--radius-sm: 8px;    /* 小圆角（按钮） */
--radius-md: 12px;   /* 中圆角（卡片） */
--radius-lg: 16px;   /* 大圆角（步骤图片） */

/* 阴影 */
--shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08);  /* 卡片阴影 */
--shadow-hover: 0 4px 20px rgba(0, 0, 0, 0.12); /* 悬停阴影 */
```

---

## 🧩 关键组件设计

### A. 头部大图区

**结构**：
```tsx
<div className="header-hero">
  <img src="啤酒鸭大图.jpg" />
  <div className="gradient-overlay" /> {/* 底部深色渐变遮罩 */}

  <div className="content">
    <span className="tag">BRAISED DUCK IN BEER • 湘菜风味</span>
    <h1>啤酒鸭</h1>
    <p className="healing-quote">
      <span className="bar" /> {/* 左侧竖线 */}
      "麦香与肉脂的微醺共舞，鸭肉吸饱酒液后的软糯暴击。"
    </p>
  </div>
</div>
```

**样式要点**：
- 全宽展示
- 底部渐变遮罩（从透明到深色）
- 文字叠加在图片上
- 治愈文案前有竖线装饰

---

### B. 信息卡片（难度、时间、卡路里）

**结构**：
```tsx
<div className="info-cards">
  <div className="card">
    <div className="icon">🔥</div>
    <div className="label">难度系数</div>
    <div className="value">中等</div>
  </div>
  {/* 重复3次 */}
</div>
```

**样式要点**：
- 白色背景，圆角，轻阴影
- 图标居中，大号emoji
- 标签灰色小字
- 数值深色大字

---

### C. 食材清单侧边栏（固定）

**结构**：
```tsx
<aside className="ingredient-sidebar">
  <div className="header">
    <h3>食材清单</h3>
    <span className="mode-tag">模式:生活化</span>
  </div>

  <div className="servings-toggle">
    <button>2人</button>
    <button className="active">3人</button> {/* 胶囊式三选一 */}
    <button>6人</button>
  </div>

  <div className="section">
    <h4>主料 <span className="en">MAIN</span></h4>
    <ul>
      <li>
        <div className="icon">🍖</div> {/* 彩色圆形背景 */}
        <span className="name">鸭肉 (半只)</span>
        <span className="amount">750G</span>
      </li>
      {/* ... */}
    </ul>
  </div>

  <div className="section">
    <h4>配料 <span className="en">SPICES</span></h4>
    {/* ... */}
  </div>
</aside>
```

**样式要点**：
- 固定在左侧（`position: sticky; top: 0`）
- 白色背景卡片
- 食材图标：彩色圆形背景 + emoji
- 份量切换：胶囊式按钮组，选中态深色

**交互逻辑**：
```typescript
// 份量切换
const [servings, setServings] = useState(3)

// 数量自动计算
const getAmount = (baseAmount: number, baseServings: number) => {
  return (baseAmount / baseServings) * servings
}

// 示例：鸭肉 750G（基准3人份）
// 2人份 → 500G
// 6人份 → 1500G
```

---

### D. 制作步骤卡片

**结构**：
```tsx
<div className="step-card">
  <div className="step-badge">STEP 01</div>

  <h3 className="step-title">冷水焯鸭去腥</h3>

  <img src="步骤图.jpg" className="step-image" />

  <p className="step-description">
    鸭肉切块冷水下锅，放入两片姜和少许料酒。大火煮开后撇去浮沫，煮2分钟捞出。
  </p>

  <div className="status-check">
    <span className="icon">✍️</span>
    <span>状态检查：水面浮起大量灰色浮沫，鸭肉变色发白。</span>
  </div>

  <button className="timer-btn">
    <span>⏱️</span> 开启冷水焯鸭去腥计时 (2分钟)
  </button>
</div>
```

**样式要点**：
- 白色背景卡片，圆角，轻阴影
- 步骤编号：小标签（STEP 01），暖棕色背景
- 图片圆角（16px）
- 状态检查：橙色图标 + 浅色背景
- 计时器按钮：白色背景，带边框

**关键步骤标记**：
```tsx
{step.isKeyStep && (
  <span className="key-step-badge">🔥 关键步骤</span>
)}
```

---

### E. AI 智能主厨

**结构**：
```tsx
<div className="ai-chef-card">
  <div className="icon">🔧</div>
  <h3>AI 智能主厨</h3>

  <p className="description">
    "我是你的数字主厨。关于这道《啤酒鸭》，有任何问题，比如没放啤酒可以用什么代替，我都会守在灶台边为你解答。"
  </p>

  <div className="input-group">
    <input
      placeholder="例如：没放啤酒可以用白酒代替吗？"
      className="ai-input"
    />
    <button className="ai-submit">咨询主厨</button>
  </div>
</div>
```

**样式要点**：
- 深棕色背景（#5C4A37）
- 白色/浅色文字
- 输入框：半透明白色背景
- 按钮：暖色调

---

### F. 底部工具栏

**结构**：
```tsx
<div className="bottom-toolbar">
  <div className="left-tools">
    <button className="tool-btn">
      <span>🔗</span> SHARE
    </button>
    <button className="tool-btn">
      <span>🖨️</span> PRINT
    </button>
  </div>

  <button className="cook-now-btn">
    <span>▶️</span> COOK NOW
  </button>
</div>
```

**样式要点**：
- 固定在底部（`position: fixed; bottom: 0`）
- COOK NOW 按钮：深棕色，大号，带播放图标
- 其他工具：灰色图标按钮

---

### G. 全屏模式（COOK NOW）

**结构**：
```tsx
<div className="fullscreen-cook-mode">
  <button className="close-btn">✕</button>

  <div className="step-content">
    <img src="步骤大图.jpg" className="step-image-large" />

    <h2 className="step-title-large">冷水焯鸭去腥</h2>

    <p className="step-description-large">
      鸭肉切块冷水下锅，放入两片姜和少许料酒。大火煮开后撇去浮沫，煮2分钟捞出。
    </p>

    <div className="status-check-large">
      状态检查：水面浮起大量灰色浮沫，鸭肉变色发白。
    </div>

    <button className="timer-btn-large">
      ⏱️ 开启冷水焯鸭去腾计时 (2分钟)
    </button>

    {/* 计时器运行时 */}
    <button className="timer-btn-active">
      ⏰ 计时运行中
    </button>
  </div>

  <div className="navigation">
    <button className="nav-prev">◀️</button>

    <div className="progress-dots">
      <span className="dot active" />
      <span className="dot" />
      <span className="dot" />
      {/* ... */}
    </div>

    <button className="nav-next">▶️</button>
  </div>
</div>
```

**样式要点**：
- 全屏覆盖（`position: fixed; inset: 0`）
- 黑色背景（#1A1A1A）
- 白色文字
- 图片大尺寸，圆角
- 导航按钮：暖色调圆形按钮
- 进度点：底部居中，当前步骤高亮

**交互逻辑**：
```typescript
// 滑动切换步骤
const [currentStep, setCurrentStep] = useState(0)

// 左右滑动手势
const handleSwipe = (direction: 'left' | 'right') => {
  if (direction === 'left' && currentStep < steps.length - 1) {
    setCurrentStep(currentStep + 1)
  } else if (direction === 'right' && currentStep > 0) {
    setCurrentStep(currentStep - 1)
  }
}

// 计时器
const [timerActive, setTimerActive] = useState(false)
const [timeLeft, setTimeLeft] = useState(120) // 秒

// 点击启动计时
const startTimer = () => {
  setTimerActive(true)
  // 倒计时逻辑...
  // 结束时播放温和提示音
}
```

---

## 📐 响应式设计

### 桌面端（> 1024px）
- 左侧固定食材清单（300px宽）
- 右侧主内容区滚动

### 平板/手机端（< 1024px）
- 食材清单折叠为可展开的抽屉
- 全宽单列布局
- 步骤卡片全宽展示

---

## ✅ 我的理解总结

### 关键设计特点：

1. **治愈系美学** ✅
   - 奶油白背景
   - 暖色调按钮
   - 圆角卡片设计
   - 柔和的阴影

2. **左右分栏布局** ✅
   - 左侧：固定食材清单
   - 右侧：滚动内容（故事+步骤）

3. **食材图标系统** ✅
   - 彩色圆形背景
   - emoji 图标
   - 清晰的数量和单位

4. **份量智能换算** ✅
   - 胶囊式切换按钮（2人/3人/6人）
   - 数值自动计算

5. **交互式计时器** ✅
   - 自动识别步骤中的时间
   - 点击启动倒计时
   - 运行时按钮状态变化

6. **全屏COOK NOW模式** ✅
   - 黑色背景
   - 超大字体
   - 左右滑动切换步骤
   - 进度指示点
   - 计时器可交互

7. **AI智能助手** ✅
   - 深棕色卡片
   - 输入框 + 咨询按钮
   - 解答用户疑问

---

## 🎯 与您确认

我的理解是否完全正确？特别是：

1. ✅ 桌面端左右分栏布局（左侧食材清单固定）
2. ✅ 食材图标是彩色圆形背景 + emoji
3. ✅ 份量切换是胶囊式三选一按钮
4. ✅ 计时器点击后显示"计时运行中"状态
5. ✅ 全屏模式是黑色背景 + 左右滑动
6. ✅ AI主厨是独立的深棕色卡片区域

有任何理解错误或遗漏的地方吗？

---

**最后更新**：2025-12-27
**设计稿来源**：prd.docx (9张设计图)
