import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CookModeView } from "@/components/recipe/CookModeView";

const steps = [
  {
    id: "step01",
    title: "准备食材",
    action: "把食材洗净切好备用。",
    speechText: "准备食材。",
    timerSec: 0,
    visualCue: "食材整齐码放。",
    failPoint: "切得太碎。",
    photoBrief: "案板上的食材特写。",
  },
  {
    id: "step02",
    title: "下锅翻炒",
    action: "热锅下油，翻炒均匀。",
    speechText: "下锅翻炒。",
    timerSec: 60,
    visualCue: "油面微微起波纹。",
    failPoint: "火太大易糊。",
    photoBrief: "锅中翻炒瞬间。",
  },
];

describe("CookModeView", () => {
  beforeEach(() => {
    Object.assign(window, {
      speechSynthesis: {
        cancel: vi.fn(),
        speak: vi.fn(),
      },
    });
  });

  it("opens and shows first step content", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    // 按钮文本已改为 "开始烹饪"
    fireEvent.click(screen.getByText("开始烹饪"));
    expect(screen.getByText("准备食材")).toBeInTheDocument();
  });

  it("navigates to next step", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    fireEvent.click(screen.getByText("开始烹饪"));
    // 下一步按钮文本是 "下一步"
    fireEvent.click(screen.getByText("下一步"));

    expect(screen.getByText("下锅翻炒")).toBeInTheDocument();
  });

  it("closes the overlay", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    fireEvent.click(screen.getByText("开始烹饪"));
    // 退出按钮文本是 "退出"
    fireEvent.click(screen.getByText("退出"));

    expect(screen.queryByText("准备食材")).not.toBeInTheDocument();
  });
});
