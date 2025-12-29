import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchResultCard } from "@/components/search/SearchResultCard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SearchResultCard", () => {
  it("renders cover image when provided", () => {
    render(
      <SearchResultCard
        id="recipe-1"
        titleZh="宫保鸡丁"
        coverImage="https://example.com/kungpao.jpg"
      />
    );

    const image = screen.getByRole("img", { name: "宫保鸡丁" });
    expect(image).toHaveAttribute("src", "https://example.com/kungpao.jpg");
  });

  it("shows placeholder when cover image is missing", () => {
    render(<SearchResultCard id="recipe-2" titleZh="麻婆豆腐" />);

    expect(
      screen.queryByRole("img", { name: "麻婆豆腐" })
    ).not.toBeInTheDocument();
  });
});
