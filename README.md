# Smatching

고등학생을 위한 1:1 멘토링 상대 추천 웹 서비스 (2022 개정 교육과정 기반).

## 구조
- `web/` — React(Vite) 프론트엔드
- `api/` — Express API (Vercel에서는 서버리스 함수 하나로 동작)
- `api/match/` — Python 매칭 스코어링 함수 (Vercel Python 런타임)
- `prisma/schema.prisma` — MySQL(PlanetScale) 스키마
- `shared/subjects.json` — 2022 개정 교육과정 과목 트리

## 로컬 실행
1. 의존성 설치: `npm install`
2. 루트에 `.env` 생성 (`.env.example` 참고) 후 `DATABASE_URL`에 PlanetScale 연결 문자열 입력
   - 아직 PlanetScale 계정이 없다면 https://planetscale.com 에서 무료로 생성 후 Connect > Prisma 탭의 문자열 사용
3. `npx prisma db push` 로 스키마 반영
4. API 서버 실행: `npm run dev:api` (http://localhost:4000)
5. 프론트엔드 실행: `npm run dev:web` (http://localhost:5173, `/api`는 자동으로 4000 포트로 프록시됨)
6. (선택) `web/.env`에 `VITE_KAKAO_REST_KEY`를 넣으면 GPS→시(市) 자동 변환이 활성화됩니다. 없으면 수동 입력으로 동작합니다.

## 배포 (GitHub + Vercel)
1. GitHub 저장소 생성 후 push
2. https://vercel.com 에서 저장소 Import
3. 프로젝트 환경변수에 `DATABASE_URL`, (선택) `VITE_KAKAO_REST_KEY` 등록
4. `vercel.json`에 빌드/라우팅 설정이 이미 되어 있어 그대로 배포하면 됩니다.
5. 배포 후 발급되는 `https://*.vercel.app` 링크는 다른 와이파이/기기에서도 접속 가능합니다.

## 검증
- `npx tsx api/src/testParser.ts` — 샘플 생기부 HTML 파싱 결과 확인
- 시크릿 창 2개로 각각 프로필을 만들어 멘토/멘티 매칭 → 대화 요청 → 알림 수신까지 수동 테스트
