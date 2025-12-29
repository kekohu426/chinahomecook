import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ConfigPage from "@/app/admin/config/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const locationData = [
  {
    id: "loc-1",
    name: "川渝",
    slug: "chuanyu",
    description: "川渝地区",
    sortOrder: 1,
    isActive: true,
  },
];

const cuisineData = [
  {
    id: "cui-1",
    name: "川菜",
    slug: "chuancai",
    description: "川菜系",
    sortOrder: 1,
    isActive: true,
  },
];

describe("ConfigPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url: any, options?: any) => {
      if (url === "/api/config/locations" && !options?.method) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: locationData }), {
            status: 200,
          })
        );
      }
      if (url === "/api/config/cuisines" && !options?.method) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: cuisineData }), {
            status: 200,
          })
        );
      }
      if (url === "/api/config/locations/loc-1" && options?.method === "PUT") {
        return Promise.resolve(new Response("{}", { status: 200 }));
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    }) as any;

    window.alert = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("loads and shows locations", async () => {
    render(<ConfigPage />);

    expect(await screen.findByText("📍 川渝")).toBeInTheDocument();
    expect(screen.getByText("地点配置 (1)")).toBeInTheDocument();
  });

  it("populates form and submits edit", async () => {
    render(<ConfigPage />);

    const editButton = await screen.findByLabelText("编辑地点 川渝");
    fireEvent.click(editButton);

    expect(screen.getByLabelText("名称")).toHaveValue("川渝");
    expect(screen.getByLabelText("Slug")).toHaveValue("chuanyu");

    fireEvent.click(screen.getByRole("button", { name: "保存更新" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/config/locations/loc-1",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });
});
