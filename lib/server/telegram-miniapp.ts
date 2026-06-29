import 'server-only';

import crypto from 'node:crypto';

export type TelegramMiniAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

export type VerifiedTelegramMiniAppInitData = {
  user: TelegramMiniAppUser;
  authDate: Date;
  queryId?: string | null;
  startParam?: string | null;
};

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN');
  }

  return token;
}

function timingSafeEqualHex(left: string, right: string) {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function verifyTelegramMiniAppInitData(initData: string) {
  if (!initData || initData.length < 10) {
    throw new Error('telegram_init_data_empty');
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');

  if (!receivedHash) {
    throw new Error('telegram_init_hash_missing');
  }

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(getBotToken())
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (!timingSafeEqualHex(calculatedHash, receivedHash)) {
    throw new Error('telegram_init_hash_invalid');
  }

  const authDateRaw = params.get('auth_date');
  const authDateSeconds = Number(authDateRaw);

  if (!Number.isFinite(authDateSeconds) || authDateSeconds <= 0) {
    throw new Error('telegram_init_auth_date_invalid');
  }

  const maxAgeSeconds = 60 * 60 * 24 * 7;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (nowSeconds - authDateSeconds > maxAgeSeconds) {
    throw new Error('telegram_init_data_expired');
  }

  const userRaw = params.get('user');

  if (!userRaw) {
    throw new Error('telegram_init_user_missing');
  }

  let user: TelegramMiniAppUser;

  try {
    user = JSON.parse(userRaw) as TelegramMiniAppUser;
  } catch {
    throw new Error('telegram_init_user_invalid');
  }

  if (!user.id || Number.isNaN(Number(user.id))) {
    throw new Error('telegram_init_user_id_invalid');
  }

  return {
    user: {
      ...user,
      id: Number(user.id),
    },
    authDate: new Date(authDateSeconds * 1000),
    queryId: params.get('query_id'),
    startParam: params.get('start_param'),
  } satisfies VerifiedTelegramMiniAppInitData;
}
