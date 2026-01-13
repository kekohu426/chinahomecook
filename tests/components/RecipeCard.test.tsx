import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecipeCard } from "@/components/recipe/RecipeCard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("RecipeCard", () => {
  it("renders cover image when provided", () => {
    render(
      <RecipeCard
        id="recipe-1"
        titleZh="红烧肉"
        coverImage="https://example.com/cover.jpg"
      />
    );

    const image = screen.getByRole("img", { name: "红烧肉" });
    expect(image.getAttribute("src")).toContain("cover.jpg");
  });

  it("shows placeholder when cover image is missing", () => {
    render(<RecipeCard id="recipe-2" titleZh="清蒸鱼" />);

    expect(screen.getByText("🍽️")).toBeInTheDocument();
  });
});
