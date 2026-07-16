/**
 * GPS 좌표 → 시(市) 변환.
 * 카카오맵 REST API 키가 아직 설정되지 않아, 키가 있을 때만 카카오 로컬 API(좌표→행정구역)를
 * 호출하고 없으면 null을 반환해 호출부에서 수동 입력 폴백을 보여주도록 한다.
 */
const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined;

export async function reverseGeocodeToCity(lat: number, lng: number): Promise<string | null> {
  if (!KAKAO_REST_KEY) return null;
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const region = data?.documents?.[0]?.region_1depth_name as string | undefined;
    return region ?? null;
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
