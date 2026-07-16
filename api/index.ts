import { app } from "./src/app";

// Express 앱은 그 자체로 (req, res) => void 형태의 Node.js 요청 핸들러라
// Vercel Node.js 함수에 그대로 내보내면 된다. (serverless-http는 AWS Lambda 스타일
// (event, context) 시그니처용이라 Vercel에서는 요청을 이해하지 못하고 응답 없이 300초
// 타임아웃까지 멈춰 있었다 — 이게 실제 원인이었음.)
export default app;
