/**
 * Coordinate taps were measured on RF8T802226Y (1080x2408). Scale them
 * to the current window so the same screens work on other devices
 * (e.g. Honor NIC-LX2 720x1604) without changing the baseline numbers.
 */
const REF_WIDTH = 1080;
const REF_HEIGHT = 2408;

export async function scalePoint(
  x: number,
  y: number,
): Promise<{ x: number; y: number }> {
  const { width, height } = await driver.getWindowSize();
  return {
    x: Math.round((x * width) / REF_WIDTH),
    y: Math.round((y * height) / REF_HEIGHT),
  };
}

export async function scaleRect(region: {
  left: number;
  top: number;
  width: number;
  height: number;
}): Promise<{ left: number; top: number; width: number; height: number }> {
  const { width, height } = await driver.getWindowSize();
  return {
    left: Math.round((region.left * width) / REF_WIDTH),
    top: Math.round((region.top * height) / REF_HEIGHT),
    width: Math.round((region.width * width) / REF_WIDTH),
    height: Math.round((region.height * height) / REF_HEIGHT),
  };
}
