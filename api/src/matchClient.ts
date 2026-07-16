import { spawnSync } from "node:child_process";
import path from "node:path";

export type Role = "teach" | "learn"; // teach = 나는 가르치고 싶다(멘티 고르기), learn = 나는 배우고 싶다(멘토 고르기)

interface Criteria {
  grade: number;
  track: string;
  subject: string;
  school?: string;
  city?: string;
  timeSlots?: { day: string; start: string; end: string }[];
}

/**
 * 후보자 점수 계산을 Python 매칭 함수에 위임한다.
 * - Vercel 배포 환경: 같은 프로젝트 내 /api/match/{role}.py 서버리스 함수를 HTTP로 호출.
 * - 로컬 개발 환경: python 서브프로세스를 직접 실행해 동일한 scoring.py 로직을 재사용.
 */
export async function scoreCandidates(role: Role, criteria: Criteria, candidates: any[]): Promise<any[]> {
  const subjectField = role === "teach" ? "learnSubject" : "teachSubject";
  const payload = { criteria: { ...criteria, subjectField }, candidates };

  if (process.env.VERCEL_URL) {
    const base = process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    const res = await fetch(`${base}/api/match/${role}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  const scriptPath = path.join(__dirname, "..", "match", "scoring.py");
  const proc = spawnSync("python", [scriptPath], {
    input: JSON.stringify(payload),
    encoding: "utf-8",
  });
  if (proc.error || proc.status !== 0) {
    throw new Error(`매칭 스크립트 실행 실패: ${proc.stderr || proc.error}`);
  }
  return JSON.parse(proc.stdout);
}
