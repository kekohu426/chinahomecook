import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { IngredientSidebar } from "@/components/recipe/IngredientSidebar";

const ingredients = [
  {
    section: "主料",
    items: [
      {
        name: "鸡蛋",
        iconKey: "egg",
        amount: 2,
        unit: "个",
      },
    ],
  },
];

describe("IngredientSidebar", () => {
  it("renders unique serving options when baseServings would duplicate", () => {
    render(<IngredientSidebar ingredients={ingredients as any} baseServings={2} />);

    // 按钮文本格式是 "{size} 人" (有空格)
    expect(screen.getByText(/2\s*人/)).toBeInTheDocument();
    expect(screen.getByText(/3\s*人/)).toBeInTheDocument();
    expect(screen.getByText(/4\s*人/)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
