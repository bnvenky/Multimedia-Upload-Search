/** Drops empty values and joins arrays, so URLs stay short: { type: ['image', 'video'] } -> type=image,video */
export const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
      .filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

export const splitList = (value) =>
  value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
