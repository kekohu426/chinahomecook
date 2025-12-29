import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeForm } from "@/components/admin/RecipeForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/components/admin/ImageUploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

vi.mock("@/components/admin/ImageGenerator", () => ({
  ImageGenerator: () => <div data-testid="image-generator" />,
}));

describe("RecipeForm", () => {
  it("adds a new ingredient section", async () => {
    const user = userEvent.setup();
    render(<RecipeForm mode="create" />);

    const before = screen.getAllByPlaceholderText("分组名称（例：主料）").length;
    await user.click(screen.getByText("+ 新增分组"));
    const after = screen.getAllByPlaceholderText("分组名称（例：主料）").length;

    expect(after).toBe(before + 1);
  });

  it("adds a new step", async () => {
    const user = userEvent.setup();
    render(<RecipeForm mode="create" />);

    await user.click(screen.getByText("+ 新增步骤"));
    expect(screen.getByText("步骤 2")).toBeInTheDocument();
  });

  it("updates publish state when publish button is clicked", async () => {
    const user = userEvent.setup();
    render(<RecipeForm mode="create" />);

    await user.click(screen.getByText("发布"));
    expect(screen.getByText("当前状态：已发布")).toBeInTheDocument();
  });
});
