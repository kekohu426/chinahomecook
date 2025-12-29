import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CookModeView } from "@/components/recipe/CookModeView";
import type { RecipeStep } from "@/types/recipe";

const steps: RecipeStep[] = [
  {
    id: "step01",
    title: "准备材料",
    action: "切好食材备用。",
    speechText: "准备材料。",
    timerSec: 60,
    visualCue: "食材摆放整齐。",
    failPoint: "切得太大影响口感。",
    photoBrief: "准备食材特写",
  },
  {
    id: "step02",
    title: "下锅翻炒",
    action: "热锅下油翻炒。",
    speechText: "开始翻炒。",
    timerSec: 0,
    visualCue: "香味出来。",
    failPoint: "火候过大易糊。",
    photoBrief: "翻炒过程",
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

  it("opens full-screen view and shows current step", async () => {
    const user = userEvent.setup();
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    await user.click(screen.getByText("COOK NOW"));
    expect(screen.getByText("准备材料")).toBeInTheDocument();
  });

  it("navigates to next step", async () => {
    const user = userEvent.setup();
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    await user.click(screen.getByText("COOK NOW"));
    await user.click(screen.getByLabelText("下一步"));
    expect(screen.getByText("下锅翻炒")).toBeInTheDocument();
  });

  it("starts timer when timer button is clicked", async () => {
    const user = userEvent.setup();
    render(<CookModeView steps={steps} recipeTitle="测试菜谱" />);

    await user.click(screen.getByText("COOK NOW"));
    await user.click(screen.getByText(/开启计时器/));
    expect(screen.getByText(/计时运行中/)).toBeInTheDocument();
  });
});
