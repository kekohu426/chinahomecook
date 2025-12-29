/**
 * 后台管理 - 创建食谱页
 *
 * 路由：/admin/recipes/new
 */

import { RecipeForm } from "@/components/admin/RecipeForm";

export default function NewRecipePage() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-medium text-textDark mb-8">
        创建新食谱
      </h1>
      <RecipeForm mode="create" />
    </div>
  );
}
