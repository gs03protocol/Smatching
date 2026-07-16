import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "./db";
import { parseNeisHtml } from "./neisParser";
import { scoreCandidates, Role } from "./matchClient";

const subjectsPath = path.join(__dirname, "..", "..", "shared", "subjects.json");

export const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // 생기부 HTML 텍스트가 커서 넉넉히 설정

function requireDeviceId(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("X-Device-Id");
  if (!deviceId) {
    res.status(401).json({ error: "X-Device-Id 헤더가 필요합니다." });
    return;
  }
  (req as any).deviceId = deviceId;
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/subjects", (_req, res) => {
  res.type("application/json").send(fs.readFileSync(subjectsPath, "utf-8"));
});

app.get("/api/geocode", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const kakaoKey = process.env.VITE_KAKAO_REST_KEY;
  if (!kakaoKey) return res.json({ city: null });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat, lng가 필요합니다." });
  }
  try {
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
    );
    if (!kakaoRes.ok) return res.json({ city: null });
    const data = await kakaoRes.json();
    const doc = data?.documents?.[0];
    const depth1 = doc?.region_1depth_name as string | undefined;
    const depth2 = doc?.region_2depth_name as string | undefined;
    // 서울/부산 등 특별시·광역시는 1depth가 이미 "시" 단위, 그 외 도(道)는 2depth(시/군)가 "시" 단위.
    const isMetro = !!depth1 && /(특별시|광역시|특별자치시)$/.test(depth1);
    const city = (isMetro ? depth1 : depth2) || depth1 || null;
    res.json({ city });
  } catch {
    res.json({ city: null });
  }
});

app.get("/api/nickname-check", async (req, res) => {
  const nickname = String(req.query.nickname || "").trim();
  if (!nickname) return res.status(400).json({ error: "닉네임을 입력해주세요." });
  const existing = await prisma.user.findUnique({ where: { nickname } });
  res.json({ available: !existing });
});

app.post("/api/upload-neis", (req, res) => {
  const html = req.body?.html;
  if (typeof html !== "string" || !html.trim()) {
    return res.status(400).json({ error: "생기부 HTML 내용이 필요합니다." });
  }
  try {
    const result = parseNeisHtml(html);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "생기부 파싱에 실패했습니다.", detail: e?.message });
  }
});

app.get("/api/profile", requireDeviceId, async (req, res) => {
  const deviceId = (req as any).deviceId as string;
  const user = await prisma.user.findUnique({ where: { id: deviceId } });
  res.json(user);
});

app.put("/api/profile", requireDeviceId, async (req, res) => {
  const deviceId = (req as any).deviceId as string;
  const {
    nickname,
    city,
    schoolName,
    gradeLevel,
    subjectGrades,
    teachSubject,
    learnSubject,
    availableTimes,
    consents,
  } = req.body ?? {};

  if (!nickname || !Array.isArray(availableTimes) || availableTimes.length < 1) {
    return res.status(400).json({ error: "닉네임과 최소 1개의 멘토링 가능 시간대는 필수입니다." });
  }
  if (!teachSubject && !learnSubject) {
    return res.status(400).json({ error: "가르칠 과목 또는 배울 과목 중 최소 1개는 입력해야 합니다." });
  }

  const existingWithNickname = await prisma.user.findUnique({ where: { nickname } });
  if (existingWithNickname && existingWithNickname.id !== deviceId) {
    return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
  }

  const user = await prisma.user.upsert({
    where: { id: deviceId },
    create: {
      id: deviceId,
      nickname,
      city,
      schoolName,
      gradeLevel,
      subjectGrades,
      teachSubject,
      learnSubject,
      availableTimes,
      consents,
    },
    update: {
      nickname,
      city,
      schoolName,
      gradeLevel,
      subjectGrades,
      teachSubject,
      learnSubject,
      availableTimes,
      consents,
    },
  });
  res.json(user);
});

app.put("/api/profile/ready", requireDeviceId, async (req, res) => {
  const deviceId = (req as any).deviceId as string;
  const { teachReady, learnReady } = req.body ?? {};
  const current = await prisma.user.findUnique({ where: { id: deviceId } });
  if (!current) return res.status(404).json({ error: "프로필을 먼저 생성해주세요." });
  if (teachReady && !current.teachSubject) {
    return res.status(400).json({ error: "가르칠 과목을 먼저 설정해야 가르치기 준비완료를 켤 수 있습니다." });
  }
  if (learnReady && !current.learnSubject) {
    return res.status(400).json({ error: "배울 과목을 먼저 설정해야 배우기 준비완료를 켤 수 있습니다." });
  }
  const user = await prisma.user.update({
    where: { id: deviceId },
    data: {
      ...(teachReady !== undefined ? { teachReady } : {}),
      ...(learnReady !== undefined ? { learnReady } : {}),
    },
  });
  res.json(user);
});

app.post("/api/candidates", requireDeviceId, async (req, res) => {
  const role = req.body?.role as Role;
  const criteria = req.body?.criteria ?? {};
  if (role !== "teach" && role !== "learn") {
    return res.status(400).json({ error: "role은 teach 또는 learn 이어야 합니다." });
  }
  // teach = 나는 가르치고 싶다 → 배우기 준비완료(learnReady) 상대를 찾는다.
  // learn = 나는 배우고 싶다 → 가르치기 준비완료(teachReady) 상대를 찾는다.
  const readyField = role === "teach" ? "learnReady" : "teachReady";
  const candidates = await prisma.user.findMany({
    where: {
      [readyField]: true,
      ...(criteria.school ? { schoolName: criteria.school } : {}),
      ...(criteria.city ? { city: criteria.city } : {}),
    },
  });
  const scored = await scoreCandidates(role, criteria, candidates);
  res.json(scored);
});

app.post("/api/request", requireDeviceId, async (req, res) => {
  const fromUserId = (req as any).deviceId as string;
  const { toUserId, role } = req.body ?? {};
  if (!toUserId || (role !== "teach" && role !== "learn")) {
    return res.status(400).json({ error: "toUserId와 role(teach|learn)이 필요합니다." });
  }
  const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
  if (!fromUser) return res.status(404).json({ error: "본인 프로필을 먼저 생성해주세요." });

  const request = await prisma.matchRequest.create({
    data: { fromUserId, toUserId, fromNick: fromUser.nickname, role },
  });
  res.json(request);
});

app.get("/api/notifications", requireDeviceId, async (req, res) => {
  const deviceId = (req as any).deviceId as string;
  const since = req.query.since ? new Date(String(req.query.since)) : new Date(0);
  const requests = await prisma.matchRequest.findMany({
    where: { toUserId: deviceId, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
  });
  const notifications = requests.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    message:
      r.role === "teach"
        ? `${r.fromNick} 멘토님에게 대화 요청이 왔어요!`
        : `${r.fromNick} 멘티님에게 대화 요청이 왔어요!`,
  }));
  res.json(notifications);
});
