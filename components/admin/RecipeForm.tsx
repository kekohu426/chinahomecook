/**
 * 食谱表单组件
 *
 * 完整的食谱创建/编辑表单（PRD Schema v1.1.0）
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ImageGenerator } from "@/components/admin/ImageGenerator";
import type {
  IngredientSection,
  ImageShot,
  Recipe,
  RecipeStep,
  StyleGuide,
} from "@/types/recipe";

interface RecipeFormProps {
  initialData?: Partial<Recipe> & {
    id?: string;
    author?: string;
    isPublished?: boolean;
    location?: string | null;
    cuisine?: string | null;
    mainIngredients?: string[];
    coverImage?: string | null;
  };
  mode: "create" | "edit";
}

const DEFAULT_INGREDIENTS: IngredientSection[] = [
  {
    section: "主料",
    items: [
      {
        name: "",
        iconKey: "meat",
        amount: 1,
        unit: "克",
        notes: "",
      },
    ],
  },
];

const DEFAULT_STEPS: RecipeStep[] = [
  {
    id: "step01",
    title: "",
    action: "",
    speechText: "",
    timerSec: 0,
    visualCue: "",
    failPoint: "",
    photoBrief: "",
  },
];

const DEFAULT_STYLE_GUIDE: StyleGuide = {
  theme: "治愈系暖调",
  lighting: "自然光",
  composition: "留白构图",
  aesthetic: "吉卜力或日杂风",
};

export function RecipeForm({ initialData, mode }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 基本信息
  const [titleZh, setTitleZh] = useState(initialData?.titleZh || "");
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || "");
  const [author, setAuthor] = useState(initialData?.author || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [cuisine, setCuisine] = useState(initialData?.cuisine || "");
  const [mainIngredientsInput, setMainIngredientsInput] = useState(
    initialData?.mainIngredients?.join(", ") || ""
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished || false
  );

  // 封面图
  const [coverImage, setCoverImage] = useState(
    initialData?.coverImage || ""
  );

  // 摘要信息
  const [oneLine, setOneLine] = useState(initialData?.summary?.oneLine || "");
  const [healingTone, setHealingTone] = useState(
    initialData?.summary?.healingTone || ""
  );
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard"
  >(initialData?.summary?.difficulty || "easy");
  const [timeTotalMin, setTimeTotalMin] = useState(
    initialData?.summary?.timeTotalMin?.toString() || ""
  );
  const [timeActiveMin, setTimeActiveMin] = useState(
    initialData?.summary?.timeActiveMin?.toString() || ""
  );
  const [servings, setServings] = useState(
    initialData?.summary?.servings?.toString() || "2"
  );

  // 文化故事
  const [storyTitle, setStoryTitle] = useState(
    initialData?.story?.title || ""
  );
  const [storyContent, setStoryContent] = useState(
    initialData?.story?.content || ""
  );
  const [storyTags, setStoryTags] = useState(
    initialData?.story?.tags?.join(", ") || ""
  );

  // 食材
  const [ingredients, setIngredients] = useState<IngredientSection[]>(
    initialData?.ingredients?.length ? initialData.ingredients : DEFAULT_INGREDIENTS
  );

  // 步骤
  const [steps, setSteps] = useState<RecipeStep[]>(
    initialData?.steps?.length ? initialData.steps : DEFAULT_STEPS
  );

  // 风格指南
  const [styleGuide, setStyleGuide] = useState<StyleGuide>(
    initialData?.styleGuide || DEFAULT_STYLE_GUIDE
  );

  // 配图方案
  const [imageShots, setImageShots] = useState<ImageShot[]>(
    initialData?.imageShots || []
  );

  const mainIngredients = useMemo(() => {
    return mainIngredientsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [mainIngredientsInput]);

  // 食材操作
  const updateSectionTitle = (index: number, value: string) => {
    const next = [...ingredients];
    next[index] = { ...next[index], section: value };
    setIngredients(next);
  };

  const addIngredientSection = () => {
    setIngredients([
      ...ingredients,
      {
        section: "",
        items: [
          {
            name: "",
            iconKey: "other",
            amount: 1,
            unit: "克",
            notes: "",
          },
        ],
      },
    ]);
  };

  const removeIngredientSection = (index: number) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const updateIngredientItem = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof IngredientSection["items"][number],
    value: string
  ) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    const items = [...section.items];
    const updatedItem = { ...items[itemIndex] };

    if (field === "amount") {
      updatedItem.amount = Number(value) || 0;
    } else {
      updatedItem[field] = value as never;
    }

    items[itemIndex] = updatedItem;
    next[sectionIndex] = { ...section, items };
    setIngredients(next);
  };

  const addIngredientItem = (sectionIndex: number) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    next[sectionIndex] = {
      ...section,
      items: [
        ...section.items,
        { name: "", iconKey: "other", amount: 1, unit: "克", notes: "" },
      ],
    };
    setIngredients(next);
  };

  const removeIngredientItem = (sectionIndex: number, itemIndex: number) => {
    const next = [...ingredients];
    const section = next[sectionIndex];
    if (section.items.length === 1) return;
    next[sectionIndex] = {
      ...section,
      items: section.items.filter((_, idx) => idx !== itemIndex),
    };
    setIngredients(next);
  };

  // 步骤操作
  const updateStepField = (
    index: number,
    field: keyof RecipeStep,
    value: string
  ) => {
    const next = [...steps];
    const updated = { ...next[index] } as RecipeStep;

    if (field === "timerSec") {
      updated.timerSec = Number(value) || 0;
    } else {
      updated[field] = value as never;
    }

    next[index] = updated;
    setSteps(next);
  };

  const addStep = () => {
    const nextIndex = steps.length + 1;
    const nextId = `step${nextIndex.toString().padStart(2, "0")}`;
    setSteps([
      ...steps,
      {
        id: nextId,
        title: "",
        action: "",
        speechText: "",
        timerSec: 0,
        visualCue: "",
        failPoint: "",
        photoBrief: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  // 配图方案操作
  const updateImageShot = (
    index: number,
    field: keyof ImageShot,
    value: string
  ) => {
    const next = [...imageShots];
    const updated = { ...next[index] } as ImageShot;
    updated[field] = value as never;
    next[index] = updated;
    setImageShots(next);
  };

  const addImageShot = () => {
    setImageShots([
      ...imageShots,
      { key: "", imagePrompt: "", ratio: "16:9" },
    ]);
  };

  const removeImageShot = (index: number) => {
    setImageShots(imageShots.filter((_, idx) => idx !== index));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | null;
    const publishValue =
      submitter?.dataset.publish === "true"
        ? true
        : submitter?.dataset.publish === "false"
          ? false
          : isPublished;

    try {
      const data = {
        schemaVersion: "1.1.0",
        titleZh,
        titleEn,
        summary: {
          oneLine,
          healingTone,
          difficulty,
          timeTotalMin: Number(timeTotalMin) || 0,
          timeActiveMin: Number(timeActiveMin) || 0,
          servings: Number(servings) || 0,
        },
        story: {
          title: storyTitle,
          content: storyContent,
          tags: storyTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        ingredients,
        steps,
        styleGuide,
        imageShots,
        author,
        location: location || undefined,
        cuisine: cuisine || undefined,
        mainIngredients,
        coverImage: coverImage || undefined,
        isPublished: publishValue,
      };

      const url =
        mode === "create"
          ? "/api/recipes"
          : `/api/recipes/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/admin/recipes");
      } else {
        const error = await response.json();
        alert(`保存失败: ${error.error}`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请检查字段内容");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 顶部操作区 */}
      <section className="bg-white rounded-md shadow-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-textDark">
            {mode === "create" ? "新建食谱" : "编辑食谱"}
          </h2>
          <p className="text-sm text-textGray mt-1">
            当前状态：{isPublished ? "已发布" : "草稿"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            onClick={() => {
              setIsPublished(false);
            }}
            className="bg-lightGray text-textDark hover:bg-cream"
            data-publish="false"
          >
            {loading ? "保存中..." : "保存草稿"}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={() => {
              setIsPublished(true);
            }}
            className="bg-brownWarm hover:bg-brownWarm/90"
            data-publish="true"
          >
            {loading ? "发布中..." : "发布"}
          </Button>
        </div>
      </section>

      {/* 基本信息 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              中文标题 *
            </label>
            <Input
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              required
              placeholder="例：啤酒鸭"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              英文标题
            </label>
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="例：Beer Duck"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              作者
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="例：Recipe Zen Team"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              地点
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：川渝"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              菜系
            </label>
            <Input
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="例：川菜"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              主要食材（逗号分隔）
            </label>
            <Input
              value={mainIngredientsInput}
              onChange={(e) => setMainIngredientsInput(e.target.value)}
              placeholder="例：鸭肉, 啤酒"
            />
          </div>
        </div>
      </section>

      {/* 封面图 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">封面图</h2>
        <div className="mb-4">
          {coverImage ? (
            <img
              src={coverImage}
              alt="封面图"
              className="w-full max-h-80 object-cover rounded-md border border-lightGray"
            />
          ) : (
            <div className="w-full h-56 rounded-md border border-dashed border-lightGray flex items-center justify-center text-textGray">
              暂无封面图
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            category="recipes/cover"
            onUploadSuccess={setCoverImage}
          />
          <ImageGenerator
            recipeName={titleZh}
            onImageGenerated={setCoverImage}
          />
        </div>
      </section>

      {/* 摘要信息 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">摘要信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-textDark mb-2">
              一句话简介
            </label>
            <Input
              value={oneLine}
              onChange={(e) => setOneLine(e.target.value)}
              placeholder="例：麦香与肉脂的微醺共舞"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-textDark mb-2">
              治愈文案
            </label>
            <Input
              value={healingTone}
              onChange={(e) => setHealingTone(e.target.value)}
              placeholder="例：家的味道，总在啤酒香里藏着"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              难度
            </label>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard")
              }
              className="w-full px-3 py-2 border border-lightGray rounded-sm"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              总耗时（分钟）
            </label>
            <Input
              type="number"
              value={timeTotalMin}
              onChange={(e) => setTimeTotalMin(e.target.value)}
              placeholder="例：60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              操作时间（分钟）
            </label>
            <Input
              type="number"
              value={timeActiveMin}
              onChange={(e) => setTimeActiveMin(e.target.value)}
              placeholder="例：30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              基准份量
            </label>
            <Input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="例：3"
            />
          </div>
        </div>
      </section>

      {/* 文化故事 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">文化故事</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              故事标题
            </label>
            <Input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="例：啤酒鸭的前世今生"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              标签（逗号分隔）
            </label>
            <Input
              value={storyTags}
              onChange={(e) => setStoryTags(e.target.value)}
              placeholder="例：家常菜, 川菜, 文化故事"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              故事内容
            </label>
            <textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-lightGray rounded-sm"
              placeholder="输入文化故事..."
            />
          </div>
        </div>
      </section>

      {/* 食材清单 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">食材清单</h2>
          <Button type="button" variant="outline" onClick={addIngredientSection}>
            + 新增分组
          </Button>
        </div>

        <div className="space-y-6">
          {ingredients.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border border-lightGray rounded-md p-4">
              <div className="flex items-center justify-between mb-4 gap-3">
                <Input
                  value={section.section}
                  onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                  placeholder="分组名称（例：主料）"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeIngredientSection(sectionIndex)}
                >
                  删除分组
                </Button>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
                  >
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "name", e.target.value)
                      }
                      placeholder="食材名称"
                    />
                    <select
                      value={item.iconKey}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "iconKey", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-lightGray rounded-sm"
                    >
                      <option value="meat">肉类</option>
                      <option value="veg">蔬菜</option>
                      <option value="fruit">水果</option>
                      <option value="seafood">海鲜</option>
                      <option value="grain">谷物</option>
                      <option value="bean">豆类</option>
                      <option value="dairy">乳制品</option>
                      <option value="egg">蛋类</option>
                      <option value="spice">香料</option>
                      <option value="sauce">酱料</option>
                      <option value="oil">油脂</option>
                      <option value="other">其他</option>
                    </select>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "amount", e.target.value)
                      }
                      placeholder="数量"
                    />
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "unit", e.target.value)
                      }
                      placeholder="单位"
                    />
                    <Input
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateIngredientItem(sectionIndex, itemIndex, "notes", e.target.value)
                      }
                      placeholder="备注"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeIngredientItem(sectionIndex, itemIndex)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addIngredientItem(sectionIndex)}
                  >
                    + 新增食材
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 制作步骤 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">制作步骤</h2>
          <Button type="button" variant="outline" onClick={addStep}>
            + 新增步骤
          </Button>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="border border-lightGray rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-textGray">步骤 {index + 1}</span>
                <Button type="button" variant="outline" onClick={() => removeStep(index)}>
                  删除步骤
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={step.id}
                  onChange={(e) => updateStepField(index, "id", e.target.value)}
                  placeholder="步骤 ID（例：step01）"
                />
                <Input
                  value={step.title}
                  onChange={(e) => updateStepField(index, "title", e.target.value)}
                  placeholder="步骤标题"
                />
                <Input
                  value={step.speechText}
                  onChange={(e) => updateStepField(index, "speechText", e.target.value)}
                  placeholder="语音朗读文本"
                />
                <Input
                  type="number"
                  value={step.timerSec}
                  onChange={(e) => updateStepField(index, "timerSec", e.target.value)}
                  placeholder="计时秒数"
                />
                <Input
                  value={step.visualCue}
                  onChange={(e) => updateStepField(index, "visualCue", e.target.value)}
                  placeholder="视觉检查"
                />
                <Input
                  value={step.failPoint}
                  onChange={(e) => updateStepField(index, "failPoint", e.target.value)}
                  placeholder="失败点提示"
                />
                <Input
                  value={step.photoBrief}
                  onChange={(e) => updateStepField(index, "photoBrief", e.target.value)}
                  placeholder="配图说明"
                />
              </div>
              <div className="mt-4">
                <textarea
                  value={step.action}
                  onChange={(e) => updateStepField(index, "action", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-lightGray rounded-sm"
                  placeholder="详细操作描述"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 风格指南 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <h2 className="text-xl font-medium text-textDark mb-4">风格指南</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={styleGuide.theme}
            onChange={(e) =>
              setStyleGuide({ ...styleGuide, theme: e.target.value })
            }
            placeholder="主题"
          />
          <Input
            value={styleGuide.lighting}
            onChange={(e) =>
              setStyleGuide({ ...styleGuide, lighting: e.target.value })
            }
            placeholder="光线"
          />
          <Input
            value={styleGuide.composition}
            onChange={(e) =>
              setStyleGuide({ ...styleGuide, composition: e.target.value })
            }
            placeholder="构图"
          />
          <Input
            value={styleGuide.aesthetic}
            onChange={(e) =>
              setStyleGuide({ ...styleGuide, aesthetic: e.target.value })
            }
            placeholder="美学风格"
          />
        </div>
      </section>

      {/* 配图方案 */}
      <section className="bg-white rounded-md shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-textDark">配图方案</h2>
          <Button type="button" variant="outline" onClick={addImageShot}>
            + 新增配图
          </Button>
        </div>

        <div className="space-y-4">
          {imageShots.map((shot, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <Input
                value={shot.key}
                onChange={(e) => updateImageShot(index, "key", e.target.value)}
                placeholder="key (hero/step01)"
              />
              <Input
                value={shot.imagePrompt}
                onChange={(e) => updateImageShot(index, "imagePrompt", e.target.value)}
                placeholder="AI 提示词"
              />
              <select
                value={shot.ratio}
                onChange={(e) => updateImageShot(index, "ratio", e.target.value)}
                className="w-full px-3 py-2 border border-lightGray rounded-sm"
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="3:2">3:2</option>
              </select>
              <Button type="button" variant="outline" onClick={() => removeImageShot(index)}>
                删除
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* 底部操作 */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          返回
        </Button>
      </div>
    </form>
  );
}
