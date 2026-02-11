
import { parseAndValidateRecipes } from "../lib/validators/recipe-import";
import { RecipeSchema } from "../lib/validators/recipe";

const json = {
    "schemaVersion": "2.0.0",
    "recipe": {
        "titleZh": "宫爆鸡丁",
        "titleEn": "Kung Pao Chicken",
        "aliases": ["宫保鸡丁"],
        "origin": {
            "country": "中国",
            "region": "四川",
            "cuisine": "川菜",
            "notes": "宫爆鸡丁起源于川菜体系，是经典的酸甜麻辣风味代表菜。"
        },
        "primaryIngredients": ["鸡肉", "干辣椒", "花生米"],
        "summary": {
            "oneLine": "酸甜微辣、鸡丁嫩滑的经典家常川菜。",
            "healingTone": "暖锅快炒的香气让人放松安心，是很有烟火气的一道菜。",
            "flavorTags": ["酸甜", "微辣", "香"],
            "difficulty": "easy",
            "timeTotalMin": 30,
            "timeActiveMin": 20,
            "servings": 2,
            "scaleHint": "按人数等比例增加鸡肉和调味汁即可。"
        },
        "story": "宫爆鸡丁是一道在家庭厨房中极易复刻的经典菜。通过先腌后滑、再快速合炒的方式，让鸡肉保持嫩滑，酸甜麻辣的酱汁在高温中迅速裹匀，几分钟就能完成一盘下饭菜。",
        "equipment": [
            {
                "name": "炒锅",
                "required": true,
                "notes": "普通家用炒锅即可"
            },
            {
                "name": "砧板",
                "required": true,
                "notes": "用于处理食材"
            },
            {
                "name": "菜刀",
                "required": true,
                "notes": "锋利更易切丁"
            }
        ],
        "ingredients": [
            {
                "section": "主料",
                "items": [
                    {
                        "name": "鸡胸肉",
                        "amount": 300,
                        "unit": "克",
                        "iconKey": "chicken",
                        "prep": "切成1.5厘米见方的丁",
                        "notes": "也可用鸡腿肉更嫩"
                    }
                ]
            },
            {
                "section": "辅料与调味",
                "items": [
                    {
                        "name": "干辣椒",
                        "amount": 8,
                        "unit": "个",
                        "iconKey": "dried_chili",
                        "prep": "剪段去籽",
                        "notes": "按耐辣程度调整"
                    },
                    {
                        "name": "花生米",
                        "amount": 40,
                        "unit": "克",
                        "iconKey": "peanut",
                        "prep": "提前炸熟或烘熟",
                        "notes": ""
                    },
                    {
                        "name": "生抽",
                        "amount": 20,
                        "unit": "毫升",
                        "iconKey": "soy_sauce",
                        "prep": "用于腌制和调汁",
                        "notes": ""
                    },
                    {
                        "name": "香醋",
                        "amount": 15,
                        "unit": "毫升",
                        "iconKey": "vinegar",
                        "prep": "调汁使用",
                        "notes": ""
                    },
                    {
                        "name": "白糖",
                        "amount": 15,
                        "unit": "克",
                        "iconKey": "sugar",
                        "prep": "调汁使用",
                        "notes": ""
                    }
                ]
            }
        ],
        "steps": [
            {
                "id": "step01",
                "title": "腌制鸡丁",
                "action": "将鸡丁放入碗中，加入生抽、料酒和少量淀粉，抓匀后腌制10分钟。",
                "speechText": "把鸡丁用生抽和料酒抓匀，腌一会儿让它更嫩。",
                "heat": "无",
                "timeMin": 10,
                "timeMax": 10,
                "timerSec": 600,
                "visualCue": "鸡丁表面略微湿润",
                "failPoint": "腌制时间太短不入味",
                "failurePoints": ["未抓匀导致口感不均"]
            },
            {
                "id": "step02",
                "title": "滑炒鸡丁",
                "action": "热锅倒油，中火下鸡丁快速翻炒至变色后盛出。",
                "speechText": "油热后下鸡丁，快速炒到变白就盛出来。",
                "heat": "中火",
                "timeMin": 2,
                "timeMax": 3,
                "timerSec": 150,
                "visualCue": "鸡丁变白但未焦黄",
                "failPoint": "炒太久会变柴",
                "failurePoints": ["火过大导致鸡丁发干"]
            },
            {
                "id": "step03",
                "title": "合炒成菜",
                "action": "锅中留油，下干辣椒炒香，倒回鸡丁和调好的酱汁，大火翻炒均匀，加入花生米后出锅。",
                "speechText": "辣椒炒香后倒回鸡丁和酱汁，快速翻匀，最后加花生出锅。",
                "heat": "大火",
                "timeMin": 3,
                "timeMax": 4,
                "timerSec": 210,
                "visualCue": "酱汁均匀包裹鸡丁",
                "failPoint": "酱汁收过头会发黏",
                "failurePoints": ["翻炒不及时导致粘锅"]
            }
        ],
        "nutrition": {
            "perServing": {
                "calories": 420,
                "protein": 32,
                "fat": 22,
                "carbs": 18,
                "fiber": 2,
                "sodium": 720
            },
            "dietaryLabels": ["高蛋白"],
            "disclaimer": "营养数据仅供参考，实际值可能因食材和做法不同而变化。"
        },
        "faq": [
            {
                "question": "可以不用花生吗？",
                "answer": "可以，但花生能增加口感层次，风味会更完整。"
            },
            {
                "question": "为什么鸡丁会炒老？",
                "answer": "通常是火过大或翻炒时间过长导致。"
            }
        ],
        "tips": [
            "鸡丁先滑炒再回锅能保持嫩度",
            "酸甜比例可按个人口味调整",
            "全程快炒，不要久留锅中"
        ],
        "troubleshooting": [
            {
                "problem": "鸡丁发柴",
                "cause": "火力过大或炒制时间过长",
                "fix": "缩短翻炒时间并先腌制"
            },
            {
                "problem": "酱汁过稀",
                "cause": "水分过多",
                "fix": "适当增加淀粉或大火收汁"
            }
        ],
        "relatedRecipes": {
            "similar": ["辣子鸡", "鱼香肉丝"],
            "pairing": ["白米饭"]
        },
        "pairing": {
            "suggestions": ["米饭", "啤酒"],
            "sauceOrSide": ["凉拌黄瓜"]
        },
        "tags": {
            "scenes": ["家常菜"],
            "cookingMethods": ["炒"],
            "tastes": ["酸甜", "微辣"],
            "crowds": ["新手"],
            "occasions": ["日常正餐"]
        },
        "seo": {
            "slug": "kung-pao-chicken",
            "metaTitle": "宫爆鸡丁做法｜新手也能成功的经典川菜",
            "metaDescription": "详细步骤教你在家做出酸甜微辣、鸡丁嫩滑的宫爆鸡丁。",
            "keywords": ["宫爆鸡丁", "宫保鸡丁", "川菜家常菜"]
        }
    }
};

console.log("Running debug validation...");

// Run through the main importer function used by the UI
try {
    const validated = parseAndValidateRecipes([json], "debug.json");
    console.log("Validation Result isValid:", validated[0].isValid);
    console.log("Validation Errors:", validated[0].errors);
} catch (e) {
    console.log("Validator CRASHED:", e);
}

// Run direct Schema validation to inspect the object
import { parse } from 'superjson'; // Assuming superjson or just standard
const processed = json.recipe; // Preprocess effectively does this for this structure
// Manually apply preprocessing steps from lib/validators/recipe-import.ts
if (Array.isArray(processed.steps)) {
    // @ts-ignore
    processed.steps.forEach(s => {
        if (s.heat === "无") s.heat = "无"; // Simulate current state
    });
}

const res = RecipeSchema.safeParse(processed);
if (!res.success) {
    console.log("Direct Zod Error Object Keys:", Object.keys(res.error));
    console.log("Direct Zod Error Has Errors Array:", Array.isArray(res.error.errors));
    if (res.error.errors) {
        console.log("First error:", res.error.errors[0]);
    }
} else {
    console.log("Direct Zod Parse Success");
}
