import 'server-only';

import crypto from 'node:crypto';
import { domainToASCII } from 'node:url';

export type VkIdTokenResponse = {
  access_token?: string;
  expires_in?: number;
  user_id?: string | number;
  email?: string;
  error?: string;
  error_description?: string;
  [key: string]: unknown;
};

export type VkIdProfile = {
  vkId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  screenName?: string | null;
  domain?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  rawProfile?: Record<string, unknown>;
  tokenResponse?: VkIdTokenResponse;
};

type VkOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
};

// Classic VK OAuth endpoints. This flow does not require VK Business ID profile
// confirmation and works with the regular VK developer app credentials.
const VK_AUTHORIZE_URL = 'https://oauth.vk.com/authorize';
const VK_TOKEN_URL = 'https://oauth.vk.com/access_token';
const VK_API_VERSION = '5.199';

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const CLICKBOOK_APP_URL = 'https://xn--90anfbbc3d.xn--p1ai';

function normalizeAppUrl(value?: string | null) {
  const raw = value?.trim() || CLICKBOOK_APP_URL;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    const asciiHost = domainToASCII(url.hostname) || url.hostname;

    url.protocol = 'https:';
    url.hostname = asciiHost === 'www.xn--90anfbbc3d.xn--p1ai'
      ? 'xn--90anfbbc3d.xn--p1ai'
      : asciiHost;
    url.pathname = '';
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return CLICKBOOK_APP_URL;
  }
}

export function getAppUrl() {
  return normalizeAppUrl(
    process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      CLICKBOOK_APP_URL,
  );
}

function normalizeClassicVkScope(value?: string | null) {
  const raw = value?.trim();

  // Classic oauth.vk.com is picky about permissions and returns
  // { error: "invalid_request", error_description: "invalid scope" }
  // for VK ID scopes such as vkid.personal_info and for some app types even
  // for optional scopes like email. For ClickBook login we only need the VK
  // user_id from the token response and the public profile from users.get, so
  // the safest default is to omit scope completely.
  if (!raw || raw === '-' || raw.toLowerCase() === 'none') return '';

  const scopes = raw
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean)
    .filter((scope) => !scope.startsWith('vkid.'))
    .filter((scope) => !['openid', 'profile'].includes(scope.toLowerCase()));

  return scopes.join(',');
}

export function getVkIdConfig(): VkOAuthConfig {
  const clientId = process.env.VK_ID_CLIENT_ID?.trim() || process.env.VK_CLIENT_ID?.trim();
  const clientSecret = process.env.VK_ID_CLIENT_SECRET?.trim() || process.env.VK_CLIENT_SECRET?.trim();

  if (!clientId) throw new Error('Missing VK_ID_CLIENT_ID');
  if (!clientSecret) throw new Error('Missing VK_ID_CLIENT_SECRET');

  return {
    clientId,
    clientSecret,
    redirectUri:
      process.env.VK_ID_REDIRECT_URI?.trim() ||
      process.env.VK_REDIRECT_URI?.trim() ||
      `${getAppUrl()}/api/auth/vk/callback`,
    scope: normalizeClassicVkScope(process.env.VK_ID_SCOPE || process.env.VK_SCOPE || ''),
  };
}

export function createRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Kept for compatibility with the previous VK ID implementation. Classic VK
// OAuth below does not use PKCE.
export function createPkceVerifier() {
  return crypto.randomBytes(48).toString('base64url');
}

export function createPkceChallenge(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function buildVkAuthorizeUrl(params: { state: string; codeChallenge?: string }) {
  const config = getVkIdConfig();
  const url = new URL(VK_AUTHORIZE_URL);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('display', 'page');
  if (config.scope) url.searchParams.set('scope', config.scope);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', params.state);
  url.searchParams.set('v', VK_API_VERSION);

  return url.toString();
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}

export async function exchangeVkCode(params: {
  code: string;
  codeVerifier?: string | null;
  deviceId?: string | null;
}) {
  const config = getVkIdConfig();
  const url = new URL(VK_TOKEN_URL);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('client_secret', config.clientSecret);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('code', params.code);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const payload = (await readJsonSafe(response)) as VkIdTokenResponse;

  if (!response.ok || payload.error) {
    const detail = payload.error_description || payload.error || `vk_token_${response.status}`;
    throw new Error(String(detail));
  }

  if (!payload.access_token || !payload.user_id) {
    throw new Error('vk_token_or_user_missing');
  }

  return payload;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numericOrStringValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

async function fetchVkApiProfile(accessToken: string, userId: string) {
  const url = new URL('https://api.vk.com/method/users.get');

  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('user_ids', userId);
  url.searchParams.set('fields', 'screen_name,domain,photo_200,first_name,last_name');
  url.searchParams.set('v', VK_API_VERSION);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const payload = await readJsonSafe(response);

  if (payload.error) {
    return {
      profile: null,
      raw: payload,
    };
  }

  const rows = Array.isArray(payload.response) ? payload.response : [];
  const first = rows[0];

  return {
    profile: first && typeof first === 'object' ? (first as Record<string, unknown>) : null,
    raw: payload,
  };
}

export async function getVkProfile(tokenResponse: VkIdTokenResponse): Promise<VkIdProfile> {
  const accessToken = stringValue(tokenResponse.access_token);
  const tokenVkId = numericOrStringValue(tokenResponse.user_id);

  if (!accessToken || !tokenVkId) throw new Error('vk_user_id_missing');

  const apiResult = await fetchVkApiProfile(accessToken, tokenVkId).catch((error) => ({
    profile: null,
    raw: {
      error: error instanceof Error ? error.message : String(error),
    },
  }));
  const apiProfile = apiResult.profile;
  const vkId = numericOrStringValue(apiProfile?.id) || tokenVkId;

  if (!vkId) throw new Error('vk_user_id_missing');

  const firstName = stringValue(apiProfile?.first_name);
  const lastName = stringValue(apiProfile?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

  return {
    vkId,
    firstName,
    lastName,
    fullName,
    screenName: stringValue(apiProfile?.screen_name),
    domain: stringValue(apiProfile?.domain),
    email: stringValue(tokenResponse.email),
    phone: null,
    photoUrl: stringValue(apiProfile?.photo_200),
    rawProfile: {
      apiProfile,
      apiResponse: apiResult.raw,
    },
    tokenResponse,
  };
}

export function createVkVirtualUserId(vkId: string) {
  const bytes = crypto
    .createHash('sha256')
    .update(`clickbook:vk-oauth:${vkId}`)
    .digest();

  // RFC 4122 UUID v5-ish deterministic UUID from hash bytes.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
