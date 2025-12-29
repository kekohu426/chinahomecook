# 组件目录结构

## 📁 文件夹说明

### `/components/ui`
shadcn/ui 基础组件（自动生成）
- Button, Input, Card, Dialog 等
- 不要手动修改（通过 CLI 添加）

### `/components/recipe`
食谱相关业务组件
- RecipeHeader - 头部大图 + 标题
- IngredientSidebar - 食材清单侧边栏
- StepCard - 制作步骤卡片
- CookModeView - 全屏"COOK NOW"模式
- AIChefCard - AI智能主厨对话框
- RecipeCard - 首页瀑布流卡片

### `/components/search`
搜索相关组件
- SearchBar - 搜索输入框
- SearchResultCard - 搜索结果卡片

### `/components/admin`
后台管理组件
- RecipeEditor - 食谱编辑器
- ImageUploader - 图片上传组件
- AIGenerator - AI生成工具

## 🎨 设计约束

**🚨 重要**：所有组件样式必须100%还原设计稿！

参考文档：
- `docs/UI_DESIGN.md` - 完整UI设计规范
- `docs/DESIGN_REFERENCE.md` - 设计还原验收标准
- `docs/prd-images/` - 设计稿截图

## 📝 命名规范

- 组件文件：PascalCase（例：RecipeHeader.tsx）
- 样式类名：kebab-case（例：recipe-header）
- 使用 Tailwind CSS utility classes
- 复杂样式可提取为组件级 CSS Module

## 🔧 开发指南

1. 组件必须是 TypeScript
2. 使用 `types/recipe.ts` 中的类型定义
3. 优先使用 shadcn/ui 基础组件
4. 响应式设计：移动端优先
5. 无障碍性：添加 ARIA 标签
