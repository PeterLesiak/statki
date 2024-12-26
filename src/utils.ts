export const createURLString = (route: string, params: Record<string, string>): string => {
    const urlSearchParams = new URLSearchParams(params);

    return `${route}?${urlSearchParams}`;
};
