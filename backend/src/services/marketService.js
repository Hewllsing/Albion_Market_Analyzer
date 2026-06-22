import axios from 'axios';
import { env } from '../config/env.js';
import { DEFAULT_CITIES, DEFAULT_QUALITIES, MARKET_SERVERS } from '../config/market.js';
import { itemById } from '../data/items.js';
import { saveMarketPrices } from '../models/marketPriceModel.js';
import { AppError } from '../utils/AppError.js';
import { marketCache } from './cacheService.js';

const httpClient = axios.create({
  timeout: env.marketRequestTimeoutMs,
  headers: { 'User-Agent': 'Albion-Market-Analyzer/1.0' },
});

const splitIntoChunks = (values, size = 80) => {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const normalizeServer = (server = 'europe') => {
  const normalized = String(server).toLowerCase();
  if (!MARKET_SERVERS[normalized]) {
    throw new AppError(`Servidor invalido: ${server}.`, 400, {
      allowed: Object.keys(MARKET_SERVERS),
    });
  }
  return normalized;
};

const normalizePrice = (price, server) => {
  const item = itemById.get(price.item_id);
  return {
    itemId: price.item_id,
    itemName: item?.name || price.item_id,
    category: item?.category || 'Outros',
    tier: item?.tier || null,
    enchantment: item?.enchantment || 0,
    city: price.city,
    quality: Number(price.quality),
    sellPriceMin: Number(price.sell_price_min || 0),
    sellPriceMinDate: price.sell_price_min_date || null,
    sellPriceMax: Number(price.sell_price_max || 0),
    sellPriceMaxDate: price.sell_price_max_date || null,
    buyPriceMin: Number(price.buy_price_min || 0),
    buyPriceMinDate: price.buy_price_min_date || null,
    buyPriceMax: Number(price.buy_price_max || 0),
    buyPriceMaxDate: price.buy_price_max_date || null,
    server,
  };
};

const buildRequestUrl = ({ itemIds, cities, qualities, server }) => {
  const baseUrl = MARKET_SERVERS[server];
  const itemPath = itemIds.map(encodeURIComponent).join(',');
  const query = new URLSearchParams({
    locations: cities.join(','),
    qualities: qualities.join(','),
  });
  return `${baseUrl}/${itemPath}.json?${query.toString()}`;
};

const fetchChunk = async (options) => {
  const url = buildRequestUrl(options);
  const cached = marketCache.get(url);
  if (cached) return { data: cached, cacheHit: true };

  try {
    const { data } = await httpClient.get(url);
    const normalized = data.map((price) => normalizePrice(price, options.server));
    marketCache.set(url, normalized, env.marketCacheTtlMs);
    return { data: normalized, cacheHit: false };
  } catch (error) {
    if (error.response) {
      throw new AppError('O Albion Online Data Project recusou a consulta.', 502, {
        status: error.response.status,
      });
    }
    throw new AppError('Nao foi possivel consultar os precos agora.', 502, {
      reason: error.code || error.message,
    });
  }
};

export const fetchMarketPrices = async ({
  itemIds,
  cities = DEFAULT_CITIES,
  qualities = DEFAULT_QUALITIES,
  server = 'europe',
  persist = true,
}) => {
  if (!itemIds?.length) throw new AppError('Informe ao menos um item.', 400);
  if (!cities?.length) throw new AppError('Informe ao menos uma cidade.', 400);

  const normalizedServer = normalizeServer(server);
  const chunks = splitIntoChunks([...new Set(itemIds)]);
  const responses = await Promise.all(chunks.map((chunk) => fetchChunk({
    itemIds: chunk,
    cities,
    qualities,
    server: normalizedServer,
  })));
  const data = responses.flatMap((response) => response.data);
  const persistence = { enabled: persist, saved: 0, error: null };

  if (persist && responses.some((response) => !response.cacheHit)) {
    try {
      persistence.saved = await saveMarketPrices(data);
    } catch (error) {
      persistence.error = error.message;
    }
  }

  return {
    data,
    meta: {
      server: normalizedServer,
      itemCount: new Set(data.map((price) => price.itemId)).size,
      priceCount: data.length,
      cacheHit: responses.every((response) => response.cacheHit),
      persistence,
      fetchedAt: new Date().toISOString(),
    },
  };
};
