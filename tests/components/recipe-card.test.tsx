import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import type { ReactNode } from "react";

vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: ReactNode }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe("RecipeCard", () => {
  it("renders cover image when provided", () => {
    render(
      <RecipeCard
        id="recipe-1"
        titleZh="麻婆豆腐"
        coverImage="https://example.com/cover.jpg"
        summary={{ oneLine: "香辣过瘾" }}
        aspectClass="aspect-[4/5]"
      />
    );

    const img = screen.getByRole("img", { name: "麻婆豆腐" });
    expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("renders placeholder when cover image is missing", () => {
    render(
      <RecipeCard
        id="recipe-2"
        titleZh="番茄炒蛋"
        summary={{ oneLine: "家常暖味" }}
        aspectClass="aspect-[4/5]"
      />
    );

    expect(screen.getByText("🍽️")).toBeInTheDocument();
  });

  it("falls back to titleEn when no summary text", () => {
    render(
      <RecipeCard
        id="recipe-3"
        titleZh="红烧肉"
        titleEn="Braised Pork"
        aspectClass="aspect-[4/5]"
      />
    );

    expect(screen.getByText("Braised Pork")).toBeInTheDocument();
  });
});
