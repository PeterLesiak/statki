export const createURLString = (route: string, params: Record<string, string>): string => {
  const urlSearchParams = new URLSearchParams(params);

  return `${route}?${urlSearchParams}`;
};

export const wait = (miliseconds: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, miliseconds));
};

export const randomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

export const randomInteger = (min: number, max: number): number => {
  return min + Math.floor(Math.random() * (max - min));
};

export const randomItem = <T>(array: T[]): T => {
  return array[randomInteger(0, array.length)];
};
