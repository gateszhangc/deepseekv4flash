const { test, expect } = require("@playwright/test");

test.describe("DeepSeek V4 Flash site", () => {
  test("desktop homepage renders key content and anchor navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/DeepSeek V4 Flash/i);
    await expect(page.locator("h1")).toHaveText("DeepSeek V4 Flash");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Independent DeepSeek V4 Flash keyword guide/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://deepseekv4flash.lol/");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "DeepSeek V4 Flash Guide");

    await expect(page.getByText("Independent keyword landing page")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the overview" })).toBeVisible();

    await page.getByRole("link", { name: "Explore the overview" }).click();
    await expect(page.locator("#overview")).toBeInViewport();

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "FAQ", exact: true }).click();
    await expect(page.locator("#faq")).toBeInViewport();
    await expect(page.locator(".faq-item")).toHaveCount(4);

    const imagesLoaded = await page.evaluate(() =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0)
    );
    expect(imagesLoaded).toBe(true);
  });

  test("structured data, robots, sitemap, and health endpoint stay aligned", async ({ page, request }) => {
    await page.goto("/");

    const health = await request.get("/healthz");
    expect(health.ok()).toBe(true);
    expect(await health.json()).toEqual({ ok: true });

    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Sitemap: https://deepseekv4flash.lol/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("<loc>https://deepseekv4flash.lol/</loc>");
    expect(sitemapText).toContain("<lastmod>2026-04-24</lastmod>");

    const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
      nodes.map((node) => JSON.parse(node.textContent || "{}"))
    );

    expect(jsonLd.some((entry) => entry["@type"] === "WebPage")).toBe(true);
    expect(jsonLd.some((entry) => entry["@type"] === "WebSite")).toBe(true);
    expect(jsonLd.some((entry) => entry["@type"] === "FAQPage")).toBe(true);
  });

  test("mobile layout stays within viewport and keeps sections readable", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the FAQ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What this page verifies, and what it does not claim." })).toBeVisible();
    await page.getByRole("link", { name: "Read the FAQ" }).click();
    await expect(page.locator("#faq")).toBeInViewport();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.locator(".use-card")).toHaveCount(4);
    await context.close();
  });
});
