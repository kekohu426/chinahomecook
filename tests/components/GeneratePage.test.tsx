import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GeneratePage from "@/app/admin/generate/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const locations = [{ id: "loc-1", name: "川渝" }];
const cuisines = [{ id: "cui-1", name: "川菜" }];

describe("GeneratePage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url: any, options?: any) => {
      if (url.startsWith("/api/config/locations")) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: locations }), {
            status: 200,
          })
        );
      }
      if (url.startsWith("/api/config/cuisines")) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: cuisines }), {
            status: 200,
          })
        );
      }
      if (url === "/api/ai/generate-recipe") {
        const body = JSON.parse(options.body);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: { id: `id-${body.dishName}`, titleZh: body.dishName },
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as any;

    window.alert = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("shows progress items when batch generating", async () => {
    render(<GeneratePage />);

    fireEvent.click(screen.getByText("批量生成"));
    fireEvent.change(screen.getByPlaceholderText(/麻婆豆腐/), {
      target: { value: "麻婆豆腐\n宫保鸡丁" },
    });

    fireEvent.click(screen.getByRole("button", { name: "开始批量生成" }));

    await waitFor(() => {
      const progress = screen.getByTestId("batch-progress");
      expect(within(progress).getAllByText("成功")).toHaveLength(2);
    });
  });
});
