# Recipe Zen - 快速启动指南

**版本**: MVP v0.9
**更新时间**: 2025-12-28

---

## 🚀 5分钟快速体验

### 1. 启动开发服务器

```bash
npm run dev
```

**访问**: http://localhost:3000

---

## ✨ 核心功能体验

### 功能1: 智能搜索 + AI生成

**测试步骤**:
1. 打开首页: http://localhost:3000
2. 在搜索框输入: `红烧肉`
3. 按回车搜索

**预期结果**:
- 如果数据库中有"红烧肉"，直接显示
- 如果没有，AI自动生成（3-5秒）
- 显示"✨ AI为您生成了新菜谱"提示

---

### 功能2: 筛选菜谱

**测试步骤**:
1. 打开首页
2. 点击"地点"下拉框，选择"川渝"
3. 点击"菜系"下拉框，选择"川菜"

**预期结果**:
- 自动刷新页面
- 只显示川渝地区的川菜
- 顶部显示当前筛选条件

---

### 功能3: 批量生成川菜

**API测试**:
```bash
curl -X POST http://localhost:3000/api/ai/generate-recipes-batch \
  -H "Content-Type: application/json" \
  -d '{
    "dishNames": ["麻婆豆腐", "宫保鸡丁", "回锅肉", "鱼香肉丝", "水煮鱼"],
    "location": "川渝",
    "cuisine": "川菜",
    "autoSave": true
  }'
```

**预期结果**:
- 生成5个川菜菜谱
- 自动保存到数据库
- 返回成功/失败统计

**验证生成结果**:
1. 访问首页
2. 筛选"川渝" + "川菜"
3. 看到新生成的菜谱，带有"✨ AI"标签

---

### 功能4: 单个生成菜谱

**浏览器测试** (推荐):
```bash
# 在浏览器中访问
curl -X POST http://localhost:3000/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "dishName": "东坡肉",
    "location": "江浙",
    "cuisine": "浙菜",
    "mainIngredients": ["猪肉"],
    "autoSave": true
  }'
```

或使用命令行:
```bash
curl -X POST http://localhost:3000/api/ai/generate-recipe \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "dishName": "东坡肉",
  "location": "江浙",
  "cuisine": "浙菜",
  "mainIngredients": ["猪肉"],
  "autoSave": true
}
EOF
```

---

## 🎯 常见使用场景

### 场景1: 用户搜索不存在的菜谱

1. 用户搜索"蒜泥白肉"
2. 系统检测无结果
3. AI自动生成完整菜谱
4. 用户看到新菜谱（无感知，3-5秒）

### 场景2: 管理员批量生成菜系

1. 决定扩充湘菜类别
2. 调用批量生成API
3. 传入湘菜菜名列表
4. 系统自动生成并保存

### 场景3: 用户按地点筛选

1. 想找川渝地区的菜
2. 选择地点"川渝"
3. 查看所有川渝美食
4. 可继续筛选菜系

---

## 📋 检查清单

在测试前，确保：

- [x] 数据库已连接（Neon PostgreSQL）
- [x] 环境变量已配置（.env.local）
- [x] GLM API Key有效
- [x] 已运行数据库迁移
- [x] 配置表已初始化（Location和Cuisine）

---

## 🐛 遇到问题？

### 问题1: AI生成失败
**原因**: API Key无效或网络问题
**解决**:
```bash
# 检查环境变量
cat .env.local | grep GLM_API_KEY
```

### 问题2: 搜索没有自动生成
**原因**: autoGenerate参数被禁用
**解决**:
```bash
# 确保URL中没有 &autoGenerate=false
curl "http://localhost:3000/api/search?q=测试"
```

### 问题3: 筛选无效果
**原因**: 配置表未初始化
**解决**:
```bash
# 重新运行配置表迁移
npx tsx scripts/migrate-add-config-tables.ts
```

---

## 📖 详细文档

- **功能总结**: `docs/FEATURES_SUMMARY.md`
- **API测试指南**: `docs/API_TESTING_GUIDE.md`
- **开发计划**: `docs/DEVELOPMENT_PLAN.md`
- **Schema验证**: `docs/SCHEMA_VALIDATION.md`

---

## 🎉 下一步

1. **体验搜索**: 搜索各种菜名，看AI生成
2. **体验筛选**: 尝试不同地点和菜系组合
3. **批量生成**: 用API批量生成一个菜系
4. **查看详情**: 点击菜谱卡片查看完整内容

---

## 💡 快速命令

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 重新生成Prisma Client
npx prisma generate

# 查看数据库
npx prisma studio
```

---

**祝您使用愉快！如有问题，请查看文档或提交Issue。**
