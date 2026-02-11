
import { parseAndValidateRecipes } from "../lib/validators/recipe-import";

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
        // ... rest of the JSON logic is identical to user input, just need enough structure to trigger valid processing paths
        "steps": [
            {
                "id": "step01",
                "title": "腌制鸡丁",
                "action": "...",
                "heat": "无"
            }
        ],
        "ingredients": [
            { "section": "主料", "items": [{ "name": "鸡胸肉", "iconKey": "chicken" }] }
        ]
    }
};

try {
    console.log("Running validator...");
    const validated = parseAndValidateRecipes([json], "test.json");
    console.log("Validator result:", JSON.stringify(validated, null, 2));
} catch (e) {
    console.error("Caught error:");
    console.error(e);
}
