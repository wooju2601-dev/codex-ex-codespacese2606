const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// 배포 주소 끝의 /를 제거해 요청 URL에 //가 생기지 않게 합니다.
export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
