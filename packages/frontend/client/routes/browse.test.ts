import { beforeEach, describe, expect, it, vi } from "vitest";

const { serverFetchMock } = vi.hoisted(() => ({
  serverFetchMock: vi.fn(),
}));

vi.mock("@/shared/api/server", () => ({
  serverFetch: serverFetchMock,
}));

import { loader } from "./browse";

function argsFor(url: string): Parameters<typeof loader>[0] {
  return {
    request: new Request(url),
    params: {},
    context: {},
  } as unknown as Parameters<typeof loader>[0];
}

describe("browse loader", () => {
  beforeEach(() => {
    serverFetchMock.mockReset();
  });

  it("surfaces stays listing failures to the route error boundary", async () => {
    serverFetchMock.mockRejectedValueOnce(new Error("properties unavailable"));

    await expect(
      loader(argsFor("https://ganitel.test/browse?kind=stays")),
    ).rejects.toThrow("properties unavailable");
    expect(serverFetchMock).toHaveBeenCalledWith("/properties?limit=24");
  });

  it("surfaces experiences listing failures to the route error boundary", async () => {
    serverFetchMock.mockRejectedValueOnce(new Error("experiences unavailable"));

    await expect(
      loader(argsFor("https://ganitel.test/browse?kind=experiences&q=kribi")),
    ).rejects.toThrow("experiences unavailable");
    expect(serverFetchMock).toHaveBeenCalledWith(
      "/experiences?q=kribi&limit=24",
    );
  });
});
