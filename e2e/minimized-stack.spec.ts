import { expect, test } from '@playwright/test';

for (const position of ['left', 'right', 'top', 'bottom']) {
  test(`minimized stack at ${position} enlarges, scrolls and restores`, async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 360 });
    await page.goto(
      `/iframe.html?id=floaty-minimized-stack--playground&viewMode=story&args=position:${position};windowCount:12`,
    );
    const stack = page.locator('.floaty-minimized-stack');
    await expect(stack).toHaveAttribute('data-position', position);
    const list = stack.locator('.floaty-minimized-stack-list');
    const checkVanishingPoint = () =>
      list.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const [x, y] = getComputedStyle(element)
          .perspectiveOrigin.split(' ')
          .map(Number.parseFloat);
        return Math.max(
          Math.abs(bounds.left + x - innerWidth / 2),
          Math.abs(bounds.top + y - innerHeight / 2),
        );
      });
    await expect.poll(checkVanishingPoint).toBeLessThan(1);
    const cards = stack.locator('.floaty-minimized-card');
    await expect(cards).toHaveCount(12);
    const button = page.getByRole('button', { name: 'Restore: Window 1', exact: true });
    const card = cards.first();
    await expect(cards.first()).toHaveCSS('opacity', '0.68');
    const before = await card.evaluate((element) => element.getBoundingClientRect().width);
    await button.hover();
    await expect
      .poll(() => card.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(before);
    await expect(card).toHaveCSS('opacity', '0.96');
    const bounds = await card.boundingBox();
    const container = await stack.boundingBox();
    expect(bounds).not.toBeNull();
    expect(container).not.toBeNull();
    if (bounds && container) {
      expect(bounds.x).toBeGreaterThanOrEqual(container.x);
      expect(bounds.y).toBeGreaterThanOrEqual(container.y);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(container.x + container.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(container.y + container.height);
    }
    expect(
      await stack.evaluate(
        (element) =>
          element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    await page
      .getByRole('button', { name: 'Restore: Window 12', exact: true })
      .scrollIntoViewIfNeeded();
    await expect.poll(checkVanishingPoint).toBeLessThan(1);
    await button.focus();
    await expect(button).toBeFocused();
    await expect
      .poll(() => card.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(before);
    await button.press('Enter');
    await expect(cards).toHaveCount(11);
    await expect(
      page.locator('.floaty-body').getByRole('heading', { name: 'Window 1', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Minimize all', exact: true }).press('Enter');
    await expect(cards).toHaveCount(12);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(cards.first()).toHaveCSS('transition-duration', '0s');
    expect(
      await page
        .locator('.floaty-minimized-preview')
        .first()
        .evaluate((element) => element.hasAttribute('inert')),
    ).toBe(true);
  });
}

for (const position of ['left', 'right', 'top', 'bottom']) {
  test(`first and last cards keep perspective at ${position}`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=floaty-minimized-stack--playground&viewMode=story&args=position:${position};windowCount:4`,
    );
    const cards = page.locator('.floaty-minimized-card');
    await expect(cards).toHaveCount(4);
    const depth = (card: typeof cards) =>
      card.evaluate((element) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return Math.abs(matrix.m13) + Math.abs(matrix.m23);
      });
    for (const card of [cards.first(), cards.last()]) {
      await page.mouse.move(0, 0);
      await expect.poll(() => depth(card)).toBeGreaterThan(0.1);
      await card.locator('button').hover();
      await expect(card).toHaveCSS('opacity', '0.96');
      await expect.poll(() => depth(card)).toBeGreaterThan(0.1);
      await card.locator('button').focus();
      await page.mouse.move(0, 0);
      await expect.poll(() => depth(card)).toBeGreaterThan(0.1);
    }
  });
}
