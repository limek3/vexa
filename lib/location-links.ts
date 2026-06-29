import type { MasterProfile } from '@/lib/types';

function clean(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getMasterLocationMode(profile?: Pick<MasterProfile, 'locationMode' | 'address'> | null) {
  return profile?.locationMode === 'address' && clean(profile.address) ? 'address' : 'online';
}

export function getMasterAddress(profile?: Pick<MasterProfile, 'address' | 'city'> | null) {
  const address = clean(profile?.address);
  const city = clean(profile?.city);

  if (address && city && !address.toLowerCase().includes(city.toLowerCase())) {
    return `${address}, ${city}`;
  }

  return address || city;
}

export function getYandexMapsSearchUrl(address: string) {
  const query = clean(address);
  if (!query) return null;
  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

export function getYandexMapsRouteUrl(address: string) {
  const query = clean(address);
  if (!query) return null;
  return `https://yandex.ru/maps/?mode=routes&rtext=~${encodeURIComponent(query)}&rtt=auto`;
}

export function getMasterRouteUrl(profile?: Pick<MasterProfile, 'address' | 'city' | 'mapUrl'> | null) {
  const explicit = clean(profile?.mapUrl);
  if (explicit) return explicit;

  return getYandexMapsRouteUrl(getMasterAddress(profile));
}
