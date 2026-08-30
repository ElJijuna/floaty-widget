import { expect, test } from '@playwright/test';

const defaultStory = '/iframe.html?id=components-floatywidget--default&viewMode=story';

test.describe('Floaty Storybook', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultStory);
    await page.locator('.floaty').hover();
    await expect(page.getByRole('toolbar', { name: 'Floaty controls' })).toHaveCSS('opacity', '1');
  });

  test('collapses and expands the widget', async ({ page }) => {
    const widget = page.locator('.floaty');

    await expect(page.locator('.floaty-body')).toContainText('Drag me around!');
    await page.getByRole('button', { name: 'Collapse' }).click();

    await expect(widget).toHaveClass(/collapsed/);
    await expect(page.locator('.floaty-body')).toHaveCount(0);

    await page.getByRole('button', { name: 'Expand' }).click();

    await expect(widget).not.toHaveClass(/collapsed/);
    await expect(page.locator('.floaty-body')).toContainText('Drag me around!');
  });

  test('pins movement and resizes with keyboard controls', async ({ page }) => {
    const widget = page.locator('.floaty');
    const toolbar = page.getByRole('toolbar', { name: 'Floaty controls' });
    const initialTransform = await widget.evaluate((element) => element.style.transform);

    await page.getByRole('button', { name: 'Pin' }).click();
    await expect(widget).toHaveClass(/pinned/);
    await toolbar.press('ArrowRight');
    await expect(widget).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 100, 100)');

    await page.getByRole('button', { name: 'Unpin' }).click();
    await toolbar.press('ArrowRight');
    await expect
      .poll(() => widget.evaluate((element) => element.style.transform))
      .not.toBe(initialTransform);

    await page.getByRole('button', { name: 'Resize widget' }).click();
    const resizeHandle = page.getByRole('button', { name: 'Resize widget handle' });
    const widthBefore = await widget.evaluate((element) => element.getBoundingClientRect().width);

    await expect(resizeHandle).toBeVisible();
    await resizeHandle.press('ArrowRight');
    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(widthBefore);
  });
});
