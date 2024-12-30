export const createURLString = (route: string, params: Record<string, string>): string => {
  const urlSearchParams = new URLSearchParams(params);

  return `${route}?${urlSearchParams}`;
};

export const randomInteger = (min: number, max: number): number => {
  return min + Math.floor(Math.random() * (max - min));
};

export const pointInsideRect = (
  px: number,
  py: number,
  left: number,
  top: number,
  width: number,
  height: number,
): boolean => {
  return px > left && px < left + width && py > top && py < top + height;
};

export const getTileLocation = (x: number, y: number, tileSize: number): [number, number] => {
  const row = Math.floor(y / tileSize);
  const column = Math.floor(x / tileSize);

  return [row, column];
};

export const snapRectToGrid = (
  left: number,
  top: number,
  width: number,
  height: number,
  tileSize: number,
): [number, number] => {
  const leftSnapped = left - (left % tileSize);
  const leftCentered = leftSnapped + (tileSize - (width % tileSize)) * 0.5;

  const topSnapped = top - (top % tileSize);
  const topCentered = topSnapped + (tileSize - (height % tileSize)) * 0.5;

  return [leftCentered, topCentered];
};
