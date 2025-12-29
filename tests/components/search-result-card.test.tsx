import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { SearchResultCard } from "@/components/search/SearchResultCard";

vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: ReactNode }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe("SearchResultCard", () => {
  it("links to the correct recipe route", () => {
    render(
      <SearchResultCard
        id="recipe-1"
        titleZh="红烧肉"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recipe/recipe-1");
  });

  it("renders AI tag when aiGenerated is true", () => {
    render(
      <SearchResultCard
        id="recipe-2"
        titleZh="宫保鸡丁"
        aiGenerated
      />
    );

    expect(screen.getByText("✨ AI生成")).toBeInTheDocument();
  });
});
