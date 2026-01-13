/**
 * 食谱工具函数
 *
 * 提供步骤复制、下载、长图生成等功能
 */

import type { RecipeStep } from "@/types/recipe";

/**
 * 等待元素内所有图片加载完成
 */
async function waitForImagesToLoad(element: HTMLElement, timeout = 5000): Promise<void> {
  const images = element.querySelectorAll("img");
  if (images.length === 0) return;

  const imagePromises = Array.from(images).map((img) => {
    if (img.complete && img.naturalHeight > 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), timeout);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  });

  await Promise.all(imagePromises);
}

/**
 * 复制步骤卡片为图片到剪贴板
 * 将步骤卡片截图并复制到剪贴板
 */
export async function copyStepContent(
  elementId: string,
  stepNumber: number,
  stepTitle: string
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return false;
    }

    // 等待所有图片加载完成
    await waitForImagesToLoad(element);

    // 动态导入 html2canvas
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(element, {
      backgroundColor: "#FFFBF5",
      scale: 2, // 提高清晰度
      logging: false,
      useCORS: true, // 允许跨域图片
      allowTaint: false, // 不允许污染画布（保证 toBlob 正常工作）
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      throw new Error("Failed to create blob");
    }

    // 将图片复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);

    return true;
  } catch (error) {
    console.error("Failed to copy content:", error);
    return false;
  }
}

/**
 * 下载步骤为图片
 * 使用 html2canvas 将步骤卡片转换为图片
 */
export async function downloadStepImage(
  elementId: string,
  stepNumber: number,
  stepTitle: string
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return false;
    }

    // 等待所有图片加载完成
    await waitForImagesToLoad(element);

    // 动态导入 html2canvas
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(element, {
      backgroundColor: "#FFFBF5",
      scale: 2, // 提高清晰度
      logging: false,
      useCORS: true, // 允许跨域图片
      allowTaint: false, // 不允许污染画布（保证 toBlob 正常工作）
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      throw new Error("Failed to create blob");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `步骤${stepNumber}-${stepTitle}.png`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Failed to download step image:", error);
    return false;
  }
}

/**
 * 生成长图（包含所有步骤）
 */
export async function generateLongImage(
  containerElementId: string
): Promise<Blob | null> {
  try {
    const container = document.getElementById(containerElementId);
    if (!container) {
      console.error("Container element not found:", containerElementId);
      return null;
    }

    // 等待所有图片加载完成
    await waitForImagesToLoad(container);

    // 动态导入 html2canvas
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(container, {
      backgroundColor: "#FFFBF5",
      scale: 2,
      logging: false,
      useCORS: true, // 允许跨域图片
      allowTaint: false, // 不允许污染画布（保证 toBlob 正常工作）
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    return blob;
  } catch (error) {
    console.error("Failed to generate long image:", error);
    return null;
  }
}

/**
 * 下载长图
 */
export async function downloadLongImage(
  recipeTitle: string,
  containerElementId: string
): Promise<boolean> {
  try {
    const blob = await generateLongImage(containerElementId);
    if (!blob) {
      return false;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recipeTitle}-完整步骤.png`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Failed to download long image:", error);
    return false;
  }
}

/**
 * 打印长图
 */
export async function printLongImage(
  containerElementId: string
): Promise<boolean> {
  try {
    const blob = await generateLongImage(containerElementId);
    if (!blob) {
      return false;
    }

    const url = URL.createObjectURL(blob);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      console.error("Failed to open print window");
      URL.revokeObjectURL(url);
      return false;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印食谱步骤</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${url}" onload="window.print(); window.onafterprint = () => window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();

    // 清理 URL（延迟以确保打印完成）
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return true;
  } catch (error) {
    console.error("Failed to print long image:", error);
    return false;
  }
}
