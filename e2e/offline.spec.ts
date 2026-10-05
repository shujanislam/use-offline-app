import { expect, test } from "@playwright/test";
import {
  editSavedRecords,
  expectOfflineBanner,
  nav,
  savedRecordCounts,
  signIn,
  waitForOfflineData,
  waitForServiceWorker,
} from "./helpers";

test.describe("online", () => {
  test("first visit loads normally and saves data for offline use", async ({ page }) => {
    await signIn(page, "Alice Archer");
    await expect(page.getByTestId("connectivity-status")).toHaveAttribute("data-offline", "false");
    await expect(page.getByTestId("freshness")).toHaveText("Updated just now");
    await waitForOfflineData(page);
  });
});

test.describe("offline navigation", () => {
  test("prefetched routes render saved data", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForOfflineData(page);
    // Visiting the jobs list online lets its <Link prefetch> warm every job page.
    await nav(page, "Jobs").click();
    await expect(page.getByTestId("jobs-list")).toBeVisible();
    await nav(page, "Feed").click();
    // Let route prefetching (visible <Link>s + OfflineWarmup) settle.
    await page.waitForLoadState("networkidle");

    await context.setOffline(true);
    await expectOfflineBanner(page);

    await nav(page, "Jobs").click();
    await expect(page.getByTestId("jobs-list")).toContainText("Frontend Engineer");
    await expect(page.getByTestId("freshness")).toContainText("Saved for offline use");

    await page.getByRole("link", { name: /Platform Engineer/ }).click();
    await expect(page.getByRole("heading", { name: "Platform Engineer" })).toBeVisible();

    await nav(page, "Events").click();
    await expect(page.getByTestId("events-list")).toContainText("Offline-first meetup");

    await nav(page, "Profile").click();
    await expect(page.getByTestId("profile")).toContainText("Alice Archer");

    await nav(page, "Feed").click();
    await expect(page.getByTestId("feed-list")).toBeVisible();
    await expectOfflineBanner(page);
  });

  test("route that was never prefetched stays pending, then completes", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForOfflineData(page);
    await page.waitForLoadState("networkidle");

    // Job links only appear on /jobs, so they were never prefetched.
    await context.setOffline(true);
    await nav(page, "Jobs").click();
    await page.getByRole("link", { name: /Design Engineer/ }).click();
    await page.waitForTimeout(500);
    // The app doesn't break: the current page stays, with the offline banner.
    await expect(page).toHaveURL(/\/jobs$/);
    await expectOfflineBanner(page);

    await context.setOffline(false);
    await expect(page.getByRole("heading", { name: "Design Engineer" })).toBeVisible({ timeout: 10_000 });
  });

  test("dynamic server route waits for the connection, then resumes", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await page.waitForLoadState("networkidle");

    await context.setOffline(true);
    await expectOfflineBanner(page);
    await nav(page, "Live status").click();

    // The prefetched loading.tsx shell renders; the server content can't.
    await expect(page.getByTestId("connectivity-fallback")).toHaveText(
      "Waiting for a connection to load live status…",
    );
    await expect(page.getByTestId("live-status")).toBeHidden();

    await context.setOffline(false);
    // Next.js retries the pending navigation on its own.
    await expect(page.getByTestId("live-status")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("connectivity-status")).toHaveAttribute("data-offline", "false");
  });

  test("data that was never saved shows a clear unavailable state", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForOfflineData(page);
    await page.waitForLoadState("networkidle");
    await editSavedRecords(page, "events", "delete");

    await context.setOffline(true);
    await nav(page, "Events").click();
    await expect(page.getByTestId("unavailable-offline")).toContainText(
      "This content isn't available offline yet.",
    );

    await context.setOffline(false);
    await expect(page.getByTestId("events-list")).toBeVisible({ timeout: 10_000 });
  });

  test("saved data from an older cache version is not rendered", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForOfflineData(page);
    await page.waitForLoadState("networkidle");
    await editSavedRecords(page, "jobs", "make-outdated");

    await context.setOffline(true);
    await nav(page, "Jobs").click();
    await expect(page.getByTestId("unavailable-offline")).toBeVisible();
  });
});

test.describe("mutations", () => {
  test("offline post is blocked, never reported as sent", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    const text = `offline attempt ${Date.now()}`;

    await context.setOffline(true);
    await expectOfflineBanner(page);
    await page.getByLabel("New post").fill(text);
    await page.getByRole("button", { name: "Post" }).click();

    await expect(page.getByTestId("action-message")).toHaveText(
      "You're offline. This action requires an internet connection.",
    );
    // The draft is kept so the user can send it later.
    await expect(page.getByLabel("New post")).toHaveValue(text);

    await context.setOffline(false);
    await expect(page.getByTestId("action-message")).toBeHidden({ timeout: 10_000 });
    const posts = (await (await page.request.get("/api/feed")).json()) as { body: string }[];
    expect(posts.map((p) => p.body)).not.toContain(text);

    // Online, the same action goes through.
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.getByTestId("feed-list")).toContainText(text);
  });

  test("offline sign-out is blocked", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await nav(page, "Profile").click();
    await expect(page.getByTestId("profile")).toBeVisible();

    await context.setOffline(true);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByTestId("action-message")).toHaveText(
      "You're offline. This action requires an internet connection.",
    );
    await expect(page).toHaveURL(/\/profile$/);
  });
});

test.describe("reconnect", () => {
  test("refreshes stale data automatically", async ({ page, context, browser }) => {
    await signIn(page, "Alice Archer");
    await context.setOffline(true);
    await expectOfflineBanner(page);

    // Someone else posts while we're offline.
    const text = `posted while you were away ${Date.now()}`;
    const bobContext = await browser.newContext();
    const bob = await bobContext.newPage();
    await signIn(bob, "Bob Baker");
    await bob.getByLabel("New post").fill(text);
    await bob.getByRole("button", { name: "Post" }).click();
    await expect(bob.getByTestId("feed-list")).toContainText(text);
    await bobContext.close();

    await expect(page.getByTestId("feed-list")).not.toContainText(text);

    await context.setOffline(false);
    await expect(page.getByText("Back online. Updating…")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("feed-list")).toContainText(text);
    await expect(page.getByTestId("freshness")).toHaveText("Updated just now");
  });
});

test.describe("hard reload", () => {
  test("offline reload is served by the Service Worker and IndexedDB", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForServiceWorker(page);
    await waitForOfflineData(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId("feed-list")).toBeVisible();
    await expect(page.getByTestId("freshness")).toContainText("Saved for offline use");

    // A full load of a page that was never cached gets the offline fallback.
    await page.goto("/status");
    await expect(page.getByRole("heading", { name: "This page isn't available offline yet" })).toBeVisible();
  });
});

test.describe("privacy", () => {
  test("signing out removes saved data; the next user never sees it", async ({ page, context }) => {
    await signIn(page, "Alice Archer");
    await waitForOfflineData(page);

    await nav(page, "Profile").click();
    await expect(page.getByTestId("profile")).toContainText("Alice Archer");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    expect(await savedRecordCounts(page)).toEqual({ feed: 0, jobs: 0, events: 0, profile: 0 });

    await signIn(page, "Bob Baker");
    await waitForOfflineData(page);
    await page.waitForLoadState("networkidle");

    await context.setOffline(true);
    await nav(page, "Profile").click();
    await expect(page.getByTestId("profile")).toContainText("Bob Baker");
    await expect(page.getByText("Alice Archer")).toHaveCount(0);
  });

  test("API responses are never cacheable", async ({ page }) => {
    await signIn(page, "Alice Archer");
    const response = await page.request.get("/api/profile");
    expect(response.headers()["cache-control"]).toBe("private, no-store");
  });
});
