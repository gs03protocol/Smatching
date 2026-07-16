/**
 * GPS 좌표 → 시(市) 변환.
 * 브라우저에서 카카오 API를 직접 호출하면 CORS 문제로 실패할 수 있어,
 * 백엔드(/api/geocode)를 통해 서버 사이드로 호출한다.
 */
export async function reverseGeocodeToCity(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.city ?? null;
  } catch {
    return null;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
  });
}
