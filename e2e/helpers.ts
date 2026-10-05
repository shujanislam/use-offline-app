import { expect, type Page } from "@playwright/test";

const TABLES = ["feed", "jobs", "events", "profile"] as const;
type Table = (typeof TABLES)[number];

export async function signIn(page: Page, name: "Alice Archer" | "Bob Baker") {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as ${name}` }).click();
  await page.waitForURL("**/feed");
  await expect(page.getByTestId("feed-list")).toBeVisible();
}

/** Wait until the Service Worker controls the page and has finished precaching. */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
  });
}

/** Number of saved records per IndexedDB table. */
export function savedRecordCounts(page: Page) {
  return page.evaluate(
    (tables) =>
      new Promise<Record<string, number>>((resolve, reject) => {
        const open = indexedDB.open("app-offline");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const counts: Record<string, number> = {};
          const tx = db.transaction(tables, "readonly");
          for (const name of tables) {
            const req = tx.objectStore(name).count();
            req.onsuccess = () => (counts[name] = req.result);
          }
          tx.oncomplete = () => {
            db.close();
            resolve(counts);
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    [...TABLES],
  );
}

/** Wait for the background warmer to save every offline dataset. */
export async function waitForOfflineData(page: Page) {
  await expect
    .poll(() => savedRecordCounts(page), { timeout: 10_000 })
    .toEqual({ feed: 1, jobs: 1, events: 1, profile: 1 });
}

/** Run a read-write callback against one saved record, bypassing the app. */
export function editSavedRecords(page: Page, table: Table, edit: "delete" | "make-outdated") {
  return page.evaluate(
    ({ table, edit }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("app-offline");
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(table, "readwrite");
          const store = tx.objectStore(table);
          if (edit === "delete") store.clear();
          else {
            store.openCursor().onsuccess = (e) => {
              const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
              if (!cursor) return;
              cursor.update({ ...cursor.value, version: 0 });
              cursor.continue();
            };
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    { table, edit },
  );
}

export async function expectOfflineBanner(page: Page) {
  await expect(page.getByTestId("connectivity-status")).toHaveAttribute("data-offline", "true");
  await expect(page.getByText("You're offline. Showing saved content.")).toBeVisible();
}

export function nav(page: Page, label: string) {
  return page.getByRole("navigation").getByRole("link", { name: label, exact: true });
}
