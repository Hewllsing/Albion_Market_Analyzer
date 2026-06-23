export const MARKET_SERVERS = {
  americas: 'https://www.albion-online-data.com/api/v2/stats/prices',
  europe: 'https://europe.albion-online-data.com/api/v2/stats/prices',
  asia: 'https://east.albion-online-data.com/api/v2/stats/prices',
};

export const DEFAULT_CITIES = [
  'Bridgewatch',
  'Caerleon',
  'Fort Sterling',
  'Lymhurst',
  'Martlock',
  'Thetford',
];

export const BLACK_MARKET_CITY = 'Black Market';

export const MARKET_CITIES = [...DEFAULT_CITIES, BLACK_MARKET_CITY];

export const DEFAULT_QUALITIES = [1, 2, 3, 4, 5];

export const CITY_ROUTE_RISK = {
  Bridgewatch: 1,
  'Fort Sterling': 1,
  Lymhurst: 1,
  Martlock: 1,
  Thetford: 1,
  Caerleon: 3,
  [BLACK_MARKET_CITY]: 4,
};
