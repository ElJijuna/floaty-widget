import { expect, test } from '@playwright/test';

const windowStory = '/iframe.html?id=components-floatywidget--window-mode&viewMode=story';

test.describe('Floaty touch input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(windowStory);
  });

  test('drags the window with a single touch pointer', async ({ page }) => {
    const widget = page.locator('.floaty--window');
    const header = widget.locator('.floaty-header');
    const initialTransform = await widget.evaluate((element) => element.style.transform);

    const box = await header.boundingBox();
    if (!box) {
      throw new Error('Header is not visible');
    }
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + 120, y: startY + 60 }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect
      .poll(() => widget.evaluate((element) => element.style.transform))
      .not.toBe(initialTransform);
  });

  test('resizes the window by dragging a touch-enlarged resize handle', async ({ page }) => {
    const widget = page.locator('.floaty--window');
    const handle = widget.locator('.floaty-resize-handle--e');
    const widthBefore = await widget.evaluate((element) => element.getBoundingClientRect().width);

    const box = await handle.boundingBox();
    if (!box) {
      throw new Error('Resize handle is not visible');
    }
    // Coarse-pointer handles grow to 36x36px so they stay reachable with a finger.
    expect(box.width).toBeGreaterThanOrEqual(36);

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + 80, y: startY }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(widthBefore);
  });

  test('pinch-resizes the window with two simultaneous touch pointers', async ({ page }) => {
    const widget = page.locator('.floaty--window');
    const header = widget.locator('.floaty-header');
    const widthBefore = await widget.evaluate((element) => element.getBoundingClientRect().width);
    const heightBefore = await widget.evaluate((element) => element.getBoundingClientRect().height);

    const box = await header.boundingBox();
    if (!box) {
      throw new Error('Header is not visible');
    }
    const centerY = box.y + box.height / 2;
    const leftX = box.x + box.width / 2 - 20;
    const rightX = box.x + box.width / 2 + 20;

    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: leftX, y: centerY, id: 1 },
        { x: rightX, y: centerY, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: leftX - 60, y: centerY, id: 1 },
        { x: rightX + 60, y: centerY, id: 2 },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(widthBefore);
    await expect
      .poll(() => widget.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThan(heightBefore);
  });
});
