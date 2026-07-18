import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the Supabase server identity and the persistence queries so the action
// contract can be exercised without a network or database. This is the test
// that pins the failure semantics required by the UI:
//   - signed-out -> { ok:false, signedOut:true }
//   - persistence error -> { ok:false, error:true }  (never throws)
//   - success -> { ok:true, bookmarked:boolean }

vi.mock("@/lib/supabase/server", () => ({
  // overridable per-test via mockResolvedValue
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("../queries", () => ({
  getBookmark: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  upsertReadingProgress: vi.fn(),
}));

// revalidatePath / redirect come from next/* and are not invoked in the paths
// we assert here (we only assert error/signedOut returns, which short-circuit).
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { toggleBookmarkAction, saveReadingProgressAction } = await import("../actions");
const { getAuthenticatedUser } = await import("@/lib/supabase/server");
const queries = await import("../queries");

const baseInput = {
  segmentId: "dn1:1.1",
  sourceRef: "dn1",
  readerSlug: "dn1",
  edition: "pli" as const,
  page: 3,
  segmentAnchor: "dn1:1.1",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("toggleBookmarkAction contract", () => {
  it("returns signedOut and does not persist when there is no session", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      userId: null,
    });
    const result = await toggleBookmarkAction(baseInput);
    expect(result).toEqual({ ok: false, signedOut: true });
    expect(queries.getBookmark).not.toHaveBeenCalled();
    expect(queries.addBookmark).not.toHaveBeenCalled();
    expect(queries.removeBookmark).not.toHaveBeenCalled();
  });

  it("adds a bookmark when none exists, returning bookmarked:true", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u-a" },
      userId: "u-a",
    });
    (queries.getBookmark as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (queries.addBookmark as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "bm-1" });
    const result = await toggleBookmarkAction(baseInput);
    expect(result).toEqual({ ok: true, bookmarked: true });
    expect(queries.addBookmark).toHaveBeenCalledWith(expect.objectContaining({ page: 3, segmentAnchor: "dn1:1.1", userId: "u-a" }));
  });

  it("removes an existing bookmark, returning bookmarked:false", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u-a" },
      userId: "u-a",
    });
    (queries.getBookmark as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "bm-1" });
    (queries.removeBookmark as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await toggleBookmarkAction(baseInput);
    expect(result).toEqual({ ok: true, bookmarked: false });
    expect(queries.removeBookmark).toHaveBeenCalledWith("u-a", "dn1:1.1", "pli");
  });

  it("returns a recoverable error state and NEVER throws when persistence fails", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u-a" },
      userId: "u-a",
    });
    (queries.getBookmark as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (queries.addBookmark as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("rls denied"));
    // Must not throw — the reader must keep working.
    const result = await toggleBookmarkAction(baseInput);
    expect(result).toEqual({ ok: false, error: true });
  });
});

describe("saveReadingProgressAction contract", () => {
  it("returns signedOut without writing when not authenticated", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      userId: null,
    });
    const result = await saveReadingProgressAction({ readerSlug: "dn1", edition: "pli", page: 2 });
    expect(result).toEqual({ ok: false, signedOut: true });
    expect(queries.upsertReadingProgress).not.toHaveBeenCalled();
  });

  it("swallows persistence failures and returns ok:false (never throws)", async () => {
    (getAuthenticatedUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u-a" },
      userId: "u-a",
    });
    (queries.upsertReadingProgress as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    const result = await saveReadingProgressAction({ readerSlug: "dn1", edition: "pli", page: 2 });
    expect(result).toEqual({ ok: false });
  });
});
