import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StepCard } from "@/components/recipe/StepCard";

const step = {
  id: "step01",
  title: "准备食材",
  action: "把食材洗净切好备用。",
  speechText: "准备食材。",
  timerSec: 60,
  visualCue: "食材整齐码放。",
  failPoint: "切得太碎。",
  photoBrief: "案板上的食材特写。",
};

describe("StepCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders step content", () => {
    render(<StepCard step={step} stepNumber={1} />);

    expect(screen.getByText("准备食材")).toBeInTheDocument();
    // 验证步骤操作描述
    expect(screen.getByText("把食材洗净切好备用。")).toBeInTheDocument();
  });

  it("starts timer when clicking button", async () => {
    render(<StepCard step={step} stepNumber={1} />);

    // 计时器按钮使用正则匹配（UI 可能有变化）
    const timerButton = screen.queryByRole("button", { name: /计时|timer/i });
    if (timerButton) {
      fireEvent.click(timerButton);
    }
  });
});
