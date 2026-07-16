/**
 * 시연용 더미 데이터 100개를 경산 인근 지역 기준으로 생성한다.
 * 실행: npx tsx api/src/seedDemoData.ts (루트 .env의 DATABASE_URL 대상)
 *
 * 실제 학생 개인정보가 아닌 가상의 데모 데이터이며, 나중에 구분해서 지울 수 있도록
 * id는 "seed-demo-" 접두어, 닉네임은 "데모학생" 접두어를 사용한다.
 *
 * 완전 무작위 조합이면 100명이 수십x수십 개 조합에 흩어져 특정 과목 검색 시
 * 결과가 0~1명뿐일 수 있어, 대표적인 "인기 조합" 목록에 확률적으로 몰리도록 해
 * 시연 시 어떤 조합을 검색해도 여러 명이 나오도록 한다.
 */
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

import fs from "node:fs";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";

const subjectsPath = path.join(__dirname, "..", "..", "shared", "subjects.json");
const subjectTree = JSON.parse(fs.readFileSync(subjectsPath, "utf-8"));
const TRACKS: string[] = subjectTree.tracks;

const CITIES = ["경산시", "대구광역시", "영천시", "청도군", "경주시"];
const SCHOOLS = [
  "경산고등학교",
  "경산여자고등학교",
  "자인고등학교",
  "하양여자고등학교",
  "경일여자고등학교",
  "무학고등학교",
  "대구고등학교",
  "영남고등학교",
  "영천고등학교",
  "경주고등학교",
];
const DAYS = ["월", "화", "수", "목", "금", "토"];

// 시연 때 검색할 가능성이 높은 대표 조합들 (학년/계열/세부과목)
const POPULAR_COMBOS: { grade: number; track: string; subject: string }[] = [
  { grade: 1, track: "국어", subject: "공통국어1" },
  { grade: 1, track: "수학", subject: "공통수학1" },
  { grade: 1, track: "영어", subject: "공통영어1" },
  { grade: 1, track: "사회", subject: "통합사회1" },
  { grade: 1, track: "과학", subject: "통합과학1" },
  { grade: 2, track: "국어", subject: "문학" },
  { grade: 2, track: "수학", subject: "미적분Ⅰ" },
  { grade: 2, track: "영어", subject: "영어Ⅰ" },
  { grade: 3, track: "수학", subject: "미적분Ⅱ" },
  { grade: 3, track: "영어", subject: "영어Ⅲ" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSubjectChoice() {
  // 80%는 인기 조합에 몰아서 시연 시 검색 결과가 풍부하게 나오도록 하고,
  // 20%는 완전 무작위로 다양성을 준다.
  if (Math.random() < 0.8) return pick(POPULAR_COMBOS);
  const grade = randInt(1, 3);
  const track = pick(TRACKS);
  const subjects: string[] = subjectTree.grades[String(grade)][track];
  return { grade, track, subject: pick(subjects) };
}

function randomTimeSlot() {
  const startHour = randInt(14, 20);
  return {
    day: pick(DAYS),
    start: `${String(startHour).padStart(2, "0")}:00`,
    end: `${String(startHour + randInt(1, 2)).padStart(2, "0")}:00`,
  };
}

function randomSubjectGrades() {
  const grades: Record<string, { avg: number; count: number; visible: boolean }> = {};
  for (const track of TRACKS) {
    if (Math.random() < 0.1) continue; // 일부는 해당 과목 등급 정보 없음(생기부 미반영 흉내)
    grades[track] = { avg: randInt(1, 9), count: randInt(1, 6), visible: true };
  }
  return grades;
}

async function main() {
  const count = 100;
  let created = 0;

  for (let i = 1; i <= count; i++) {
    const id = `seed-demo-${i}`;
    const gradeLevel = randInt(1, 3); // 본인의 현재 학년 (가르칠/배울 내용의 학년과는 무관)
    const subjectGrades = randomSubjectGrades();

    const wantsTeach = Math.random() < 0.6;
    const wantsLearn = Math.random() < 0.6;
    const teachSubject = wantsTeach ? randomSubjectChoice() : null;
    let learnSubject = wantsLearn ? randomSubjectChoice() : null;
    if (!teachSubject && !learnSubject) learnSubject = randomSubjectChoice(); // 최소 1개 보장

    const slotCount = randInt(1, 2);
    const availableTimes = Array.from({ length: slotCount }, randomTimeSlot);

    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        nickname: `데모학생${String(i).padStart(3, "0")}`,
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel,
        subjectGrades,
        teachSubject: teachSubject ?? Prisma.JsonNull,
        learnSubject: learnSubject ?? Prisma.JsonNull,
        availableTimes,
        teachReady: !!teachSubject,
        learnReady: !!learnSubject,
        consents: { demo: true },
      },
      update: {
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel,
        subjectGrades,
        teachSubject: teachSubject ?? Prisma.JsonNull,
        learnSubject: learnSubject ?? Prisma.JsonNull,
        availableTimes,
        teachReady: !!teachSubject,
        learnReady: !!learnSubject,
      },
    });
    created++;
  }

  console.log(`✓ 데모 데이터 ${created}개 생성/갱신 완료 (id: seed-demo-1 ~ seed-demo-${count})`);
}

main()
  .catch((e) => {
    console.error("실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
