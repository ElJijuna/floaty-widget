import { expect, test } from '@playwright/test';

const defaultStory = '/iframe.html?id=components-floatywidget--default&viewMode=story';
const windowStory = '/iframe.html?id=components-floatywidget--window-mode&viewMode=story';
const layoutsStory = '/iframe.html?id=components-floatywidget--multi-window-layouts&viewMode=story';

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

test('arranges four windows into a non-overlapping grid', async ({ page }) => {
  await page.goto(layoutsStory);
  const windows = page.locator('.floaty--window');
  await expect(windows).toHaveCount(4);

  await page.getByRole('button', { name: 'Arrange grid' }).click();

  await expect
    .poll(() =>
      windows.evaluateAll((elements) => {
        const boxes = elements.map((element) => element.getBoundingClientRect());
        return boxes.every((a, first) =>
          boxes.every(
            (b, second) =>
              first === second ||
              a.right <= b.left ||
              b.right <= a.left ||
              a.bottom <= b.top ||
              b.bottom <= a.top,
          ),
        );
      }),
    )
    .toBe(true);
});

test.describe('Floaty window mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(windowStory);
  });

  test('keeps the integrated header visible and supports the window lifecycle', async ({
    page,
  }) => {
    const widget = page.locator('.floaty--window');
    const toolbar = page.getByRole('toolbar', { name: 'Integrated window controls' });
    const initialTransform = await widget.evaluate((element) => element.style.transform);

    await expect(toolbar).toHaveCSS('position', 'relative');
    await expect(toolbar).toHaveCSS('opacity', '1');
    await expect(page.getByRole('button', { name: 'Minimize' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Maximize' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Open windows' })).toBeVisible();

    await toolbar.press('ArrowRight');
    await expect
      .poll(() => widget.evaluate((element) => element.style.transform))
      .not.toBe(initialTransform);

    const toolbarBox = await toolbar.boundingBox();
    if (!toolbarBox) {
      throw new Error('Window toolbar is not visible');
    }
    const viewportHeight = page.viewportSize()?.height ?? 600;
    await page.mouse.move(
      toolbarBox.x + toolbarBox.width / 2,
      toolbarBox.y + toolbarBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(2, viewportHeight / 2, { steps: 5 });
    await page.mouse.up();

    await expect(widget).toHaveAttribute('data-snap-zone', 'left');
    await widget.locator('.floaty-button--maximize').click();
    await expect(widget).not.toHaveAttribute('data-snap-zone');

    await page.getByRole('button', { name: 'Maximize' }).click();
    await expect(widget).toHaveAttribute('data-maximized', 'true');
    await widget.locator('.floaty-button--maximize').click();
    await expect(widget).not.toHaveAttribute('data-maximized');

    const eastHandle = widget.locator('.floaty-resize-handle--e');
    await expect(eastHandle).toHaveCSS('cursor', 'ew-resize');
    await eastHandle.hover();
    const widthBefore = await widget.evaluate((element) => element.getBoundingClientRect().width);
    const handleBox = await eastHandle.boundingBox();
    if (!handleBox) {
      throw new Error('East resize edge is not visible');
    }
    const edgeX = handleBox.x + handleBox.width / 2;
    const edgeY = handleBox.y + handleBox.height / 2;
    await page.mouse.down();
    await page.mouse.move(edgeX + 48, edgeY, { steps: 5 });
    await page.mouse.up();
    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(widthBefore);

    await page.getByRole('button', { name: 'Minimize' }).click();
    await expect(widget).toHaveCount(0);
    await page
      .getByRole('toolbar', { name: 'Open windows' })
      .getByRole('button', {
        name: 'Integrated window',
        exact: true,
      })
      .click();
    await expect(widget).toBeVisible();

    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(widget).toHaveCount(0);
    await page.getByRole('button', { name: 'Open window' }).click();
    await expect(widget).toBeVisible();
  });

  test('switches between Windows and macOS title bars', async ({ page }) => {
    const widget = page.locator('.floaty--window');
    const style = page.getByRole('combobox', { name: 'Window style' });

    await expect(widget).toHaveClass(/floaty--window-windows/);
    await expect(widget.locator('.floaty-window-icon')).toBeVisible();
    await expect(widget.getByRole('button', { name: 'Pin' })).toHaveCount(0);

    await style.selectOption('mac');
    await expect(widget).toHaveClass(/floaty--window-mac/);
    await expect(widget.getByRole('button', { name: 'Close' })).toBeVisible();

    await style.selectOption('custom');
    await expect(widget).toHaveClass(/floaty--window-custom/);
  });

  test('resizes the window from the keyboard', async ({ page }) => {
    const widget = page.locator('.floaty--window');
    const resizeHandle = widget.getByRole('button', { name: /handle$/ });

    await expect(resizeHandle).toHaveCSS('opacity', '0');

    for (
      let i = 0;
      i < 20 && !(await resizeHandle.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press('Tab');
    }
    await expect(resizeHandle).toBeFocused();
    await expect(resizeHandle).toHaveCSS('opacity', '1');

    const widthBefore = await widget.evaluate((element) => element.getBoundingClientRect().width);
    const heightBefore = await widget.evaluate((element) => element.getBoundingClientRect().height);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(widthBefore);
    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThan(heightBefore);
  });
});
