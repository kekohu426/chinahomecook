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

  it("renders step content and photo placeholder", () => {
    render(<StepCard step={step} stepNumber={1} />);

    expect(screen.getByText("准备食材")).toBeInTheDocument();
    expect(screen.getByText("步骤配图（待生成）")).toBeInTheDocument();
    expect(screen.getByText("配图提示：")).toBeInTheDocument();
  });

  it("starts timer when clicking button", async () => {
    render(<StepCard step={step} stepNumber={1} />);

    fireEvent.click(screen.getByRole("button", { name: /开启计时器/ }));
    expect(screen.getByText(/计时运行中/)).toBeInTheDocument();
  });
});
