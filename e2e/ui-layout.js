import { expect } from "@playwright/test";

export async function expectPageLayout(page, label = "vista") {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const insideHorizontalScroller = element => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") return true;
      }
      return false;
    };
    const overflow = [...document.querySelectorAll("body *")]
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" &&
          rect.width > 0 && rect.height > 0 && rect.right > width + 1 &&
          style.position !== "fixed" && style.position !== "absolute" && !insideHorizontalScroller(element) &&
          element.scrollWidth <= element.clientWidth + 1;
      })
      .slice(0, 8)
      .map(element => {
        const ancestors = [];
        for (let parent = element.parentElement; parent && ancestors.length < 4; parent = parent.parentElement) {
          ancestors.push({
            selector: parent.id ? `#${parent.id}` : parent.className || parent.tagName.toLowerCase(),
            overflowX: getComputedStyle(parent).overflowX,
            left: Math.round(parent.getBoundingClientRect().left),
            right: Math.round(parent.getBoundingClientRect().right),
            clientWidth: parent.clientWidth,
            scrollWidth: parent.scrollWidth
          });
        }
        return {
          selector: element.id ? `#${element.id}` : element.className || element.tagName.toLowerCase(),
          right: Math.round(element.getBoundingClientRect().right),
          ancestors
        };
      });

    const regions = [...document.querySelectorAll("[data-layout-region]")]
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
    const overlaps = [];
    for (let left = 0; left < regions.length; left += 1) {
      for (let right = left + 1; right < regions.length; right += 1) {
        const a = regions[left], b = regions[right];
        if (a.contains(b) || b.contains(a)) continue;
        const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
        const width = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
        const height = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
        if (width > 1 && height > 1) overlaps.push([a.dataset.layoutRegion, b.dataset.layoutRegion]);
      }
    }
    return {
      width,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      wide: [...document.querySelectorAll("body *")]
        .filter(element => element.getBoundingClientRect().right > width + 1)
        .slice(0, 8)
        .map(element => ({ selector: element.id ? `#${element.id}` : element.className || element.tagName.toLowerCase(), right: Math.round(element.getBoundingClientRect().right) })),
      overflow,
      overlaps
    };
  });

  expect(result.documentWidth, `${label}: desbordamiento horizontal del documento ${JSON.stringify(result.wide)}`).toBeLessThanOrEqual(result.width + 1);
  expect(result.bodyWidth, `${label}: desbordamiento horizontal del contenido`).toBeLessThanOrEqual(result.width + 1);
  expect(result.overflow, `${label}: elementos fuera del viewport`).toEqual([]);
  expect(result.overlaps, `${label}: regiones principales solapadas`).toEqual([]);
}

export async function checkView(page, ruta, opciones = {}) {
  await expectPageLayout(page, ruta);

  for (const [selectorA, selectorB] of opciones.noSolapar ?? []) {
    const [a, b] = await Promise.all([
      page.locator(selectorA).boundingBox(),
      page.locator(selectorB).boundingBox()
    ]);
    if (!a || !b) continue;
    const overlaps = Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) + 1 &&
      Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y) + 1;
    expect(overlaps, `${ruta}: ${selectorA} se solapa con ${selectorB}`).toBe(false);
  }

  for (const selector of opciones.sinCorte ?? []) {
    const element = page.locator(selector);
    if (!(await element.isVisible())) continue;
    const dimensions = await element.evaluate(node => ({
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth
    }));
    expect(dimensions.scrollHeight, `${ruta}: contenido cortado en ${selector}`).toBeLessThanOrEqual(dimensions.clientHeight + 1);
    expect(dimensions.scrollWidth, `${ruta}: contenido cortado en ${selector}`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
}
