export const createURLString = (route: string, params: Record<string, string>): string => {
  const urlSearchParams = new URLSearchParams(params);

  return `${route}?${urlSearchParams}`;
};

export const pointInsideRect = (
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean => {
  return px > x && px < x + w && py > y && py < y + h;
};

export const randomInteger = (min: number, max: number): number => {
  return min + Math.floor(Math.random() * (max - min));
};
