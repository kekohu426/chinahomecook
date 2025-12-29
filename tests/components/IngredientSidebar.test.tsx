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

    expect(screen.getByText("2人")).toBeInTheDocument();
    expect(screen.getByText("3人")).toBeInTheDocument();
    expect(screen.getByText("4人")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
