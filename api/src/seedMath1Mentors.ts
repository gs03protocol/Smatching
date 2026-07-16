/**
 * 경산 지역 "고1 수학 공통수학1"을 가르칠 수 있는 멘토 30명 추가 생성.
 * "멘토 찾기"(멘티가 검색) 화면에서 결과가 더 풍부하게 나오도록 하기 위함.
 * id는 "seed-math1-mentor-" 접두어, 닉네임은 "수학멘토" 접두어를 사용한다.
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
    const id = `seed-math1-mentor-${i}`;
    const slotCount = randInt(1, 2);
    const availableTimes = Array.from({ length: slotCount }, randomTimeSlot);
    // 멘토는 여러 등급의 멘티와 매칭될 수 있도록 등급을 1~5 사이로 (전반적으로 상위권) 분포시킨다.
    const grade = randInt(1, 5);
    // 본인 학년은 수학을 잘 아는 선배(2~3학년)일 가능성을 높게
    const gradeLevel = pick([1, 2, 2, 3, 3]);

    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        nickname: `수학멘토${String(i).padStart(3, "0")}`,
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel,
        subjectGrades: { 수학: { avg: grade, count: randInt(2, 6), visible: true } },
        teachSubject: { grade: 1, track: "수학", subject: "공통수학1" },
        learnSubject: Prisma.JsonNull,
        availableTimes,
        teachReady: true,
        learnReady: false,
        consents: { demo: true },
      },
      update: {
        city: pick(CITIES),
        schoolName: pick(SCHOOLS),
        gradeLevel,
        subjectGrades: { 수학: { avg: grade, count: randInt(2, 6), visible: true } },
        teachSubject: { grade: 1, track: "수학", subject: "공통수학1" },
        learnSubject: Prisma.JsonNull,
        availableTimes,
        teachReady: true,
        learnReady: false,
      },
    });
  }
  console.log(`✓ 공통수학1 멘토 ${count}명 생성/갱신 완료 (id: seed-math1-mentor-1 ~ seed-math1-mentor-${count})`);
}

main()
  .catch((e) => {
    console.error("실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
