
import * as dotenv from "dotenv";
import path from "path";

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testEvolink() {
  // 动态导入，确保环境变量已加载
  const { evolinkClient } = await import("../lib/ai/evolink");

  console.log("正在测试 Evolink API...");
  console.log("API URL:", process.env.EVOLINK_API_URL);
  console.log("API Key:", process.env.EVOLINK_API_KEY ? "已配置" : "未配置");

  try {
    const result = await evolinkClient.generateImage({
      prompt: "A delicious plate of Kung Pao Chicken, food photography, high quality",
      width: 1024,
      height: 1024,
      steps: 20,
    });

    if (result.success) {
      console.log("生成成功！");
      console.log("图片 URL:", result.imageUrl);
    } else {
      console.error("生成失败:", result.error);
    }
  } catch (error) {
    console.error("测试过程中发生错误:", error);
  }
}

testEvolink();
