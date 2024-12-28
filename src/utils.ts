export const createURLString = (route: string, params: Record<string, string>): string => {
  const urlSearchParams = new URLSearchParams(params);

  return `${route}?${urlSearchParams}`;
};

export const randomInteger = (min: number, max: number): number => {
  return min + Math.floor(Math.random() * (max - min));
};
