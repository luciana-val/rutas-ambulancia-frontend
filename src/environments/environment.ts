declare const MAPBOX_TOKEN: string | undefined;

export const environment = {
  production: false,
  apiUrl: '/api',
  mapboxToken: typeof MAPBOX_TOKEN !== 'undefined' ? MAPBOX_TOKEN : '',
};
