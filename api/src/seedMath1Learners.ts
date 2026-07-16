/**
 * 경산 지역 "고1 수학 공통수학1"을 배우고 싶어하는 멘티 30명 추가 생성.
 * id는 "seed-math1-" 접두어, 닉네임은 "수학멘티" 접두어를 사용해 기존 데모 데이터와 구분한다.
 */
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

import { Prisma } from "@prisma/client";
import { prisma } from "./db";

const CITIES = ["경산시", "경산시", "경산시", "경산시", "대구광역시", "경주시"]; // 경산시 비중을 높게
const SCHOOLS = [
  "경산고등학교",
  "경산여자고등학교",
  "자인고등학교",
  "하양여자고등학교",
  "경일여자고등학교",
  "무학고등학교",
];
const DAYS = ["월", "화", "수", "목", "금", "토"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimeSlot() {
  const startHour = randInt(14, 20);
  return {
    day: pick(DAYS),
    start: `${String(startHour).padStart(2, "0")}:00`,
    end: `${String(startHour + randInt(1, 2)).padStart(2, "0")}:00`,
  };
}

async function main() {
  const count = 30;
  for (let i = 1; i <= count; i++) {
    const id = `seed-math1-${i}`;
    const slotCount = randInt(1, 2);
    const availableTimes = Array.from({ length: slotCount }, randomTimeSlot);
    const hasGrade = Math.random() < 0.85; // 대부분은 생기부 등급 정보 보유

    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        nickname: `수학멘티${String(i).padStart(3, "0")}`,
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel: 1,
        subjectGrades: hasGrade ? { 수학: { avg: randInt(1, 9), count: randInt(1, 4), visible: true } } : {},
        teachSubject: Prisma.JsonNull,
        learnSubject: { grade: 1, track: "수학", subject: "공통수학1" },
        availableTimes,
        teachReady: false,
        learnReady: true,
        consents: { demo: true },
      },
      update: {
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel: 1,
        subjectGrades: hasGrade ? { 수학: { avg: randInt(1, 9), count: randInt(1, 4), visible: true } } : {},
        teachSubject: Prisma.JsonNull,
        learnSubject: { grade: 1, track: "수학", subject: "공통수학1" },
        availableTimes,
        teachReady: false,
        learnReady: true,
      },
    });
  }
  console.log(`✓ 공통수학1 멘티 ${count}명 생성/갱신 완료 (id: seed-math1-1 ~ seed-math1-${count})`);
}

main()
  .catch((e) => {
    console.error("실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
