import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
  it("opens and shows first step content", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    fireEvent.click(screen.getByRole("button", { name: /cook now/i }));
    expect(screen.getByText("准备食材")).toBeInTheDocument();
    expect(screen.getByText(/步骤配图/)).toBeInTheDocument();
  });

  it("navigates to next step", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    fireEvent.click(screen.getByRole("button", { name: /cook now/i }));
    fireEvent.click(screen.getByLabelText("下一步"));

    expect(screen.getByText("下锅翻炒")).toBeInTheDocument();
  });

  it("closes the overlay", async () => {
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    fireEvent.click(screen.getByRole("button", { name: /cook now/i }));
    fireEvent.click(screen.getByLabelText("退出全屏"));

    expect(screen.queryByText("准备食材")).not.toBeInTheDocument();
  });
});
