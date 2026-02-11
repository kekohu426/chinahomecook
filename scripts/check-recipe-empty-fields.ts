
import { generateRecipe } from "@/lib/ai/generate-recipe";

async function main() {
    const dishName = "Test Dish";
    console.log(`Generating recipe for: ${dishName}`);

    const result = await generateRecipe({
        dishName: dishName,
    });

    if (!result.success) {
        console.error("Generation failed:", result.error);
        return;
    }

    const recipe = result.data;
    console.log("Generation successful.");

    // Recursively check for empty fields
    function checkEmpty(obj: any, path: string = "") {
        if (obj === null || obj === undefined) {
            // Allow optional fields - this is tricky because we don't know if it's optional here without schema
            // But user said "others being empty is a bug"
            // We will just log everything that is empty
            // console.log(`Field ${path} is null/undefined`);
            return;
        }

        if (typeof obj === "string") {
            if (obj.trim() === "") {
                console.log(`[EMPTY STRING] Field: ${path}`);
            }
            return;
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                // Empty array might be okay, but let's log it
                console.log(`[EMPTY ARRAY] Field: ${path}`);
            }
            obj.forEach((item, index) => {
                checkEmpty(item, `${path}[${index}]`);
            });
            return;
        }

        if (typeof obj === "object") {
            for (const key in obj) {
                // Skip image fields as per request
                if (key.includes("image") || key.includes("Image") || key === 'imageUrl') {
                    continue;
                }
                checkEmpty(obj[key], path ? `${path}.${key}` : key);
            }
        }
    }

    console.log("Checking for empty fields (excluding image fields)...");
    checkEmpty(recipe);
}

main().catch(console.error);
