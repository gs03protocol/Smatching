import * as cheerio from "cheerio";

export interface SubjectGrade {
  avg: number;
  count: number;
}

export interface NeisParseResult {
  school: string | null;
  grade: number | null;
  subjects: Partial<Record<"국어" | "수학" | "영어" | "사회" | "과학", SubjectGrade>>;
}

const TRACK_KEYWORDS: Record<string, RegExp> = {
  국어: /^국어/,
  수학: /^수학/,
  영어: /^영어/,
  사회: /^(사회|역사|도덕)/,
  과학: /^과학/,
};

function bucketOf(subjectArea: string): keyof typeof TRACK_KEYWORDS | null {
  for (const [track, re] of Object.entries(TRACK_KEYWORDS)) {
    if (re.test(subjectArea)) return track as keyof typeof TRACK_KEYWORDS;
  }
  return null;
}

/** 학적사항에서 가장 최근(가장 높은 학년)의 학교/학년을 찾는다. */
function extractSchoolGrade(html: string): { school: string | null; grade: number | null } {
  const re = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s+(\S+?)\s+제\s*(\d)\s*학년\s*(입학|진급|재학|졸업)/g;
  let best: { date: number; grade: number; school: string } | null = null;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(html))) {
    const [, y, mo, d, school, gradeStr] = m;
    const key = `${y}-${mo}-${d}-${school}-${gradeStr}`;
    if (seen.has(key)) continue; // 데스크톱/모바일 뷰 중복 제거
    seen.add(key);
    const date = parseInt(y, 10) * 10000 + parseInt(mo, 10) * 100 + parseInt(d, 10);
    const grade = parseInt(gradeStr, 10);
    if (!best || date > best.date) {
      best = { date, grade, school };
    }
  }
  if (!best) return { school: null, grade: null };
  return { school: best.school, grade: best.grade };
}

function cellValue($: cheerio.CheerioAPI, td: any): string {
  const $td = $(td);
  if ($td.attr("title") != null) return ($td.attr("title") as string).trim();
  const titled = $td.find("[title]").first();
  if (titled.length) return (titled.attr("title") as string).trim();
  return $td.text().trim();
}

/** 교과학습발달상황 표(석차등급 컬럼이 있는 표)에서 과목별 석차등급을 추출한다. */
function extractSubjectGrades(html: string): NeisParseResult["subjects"] {
  const $ = cheerio.load(html);
  const sums: Record<string, { sum: number; count: number }> = {};

  let active = false;
  let trackIdx = -1;
  let gradeIdx = -1;

  $("tr").each((_, tr) => {
    const tds = $(tr).find("> td, > th").toArray();
    if (tds.length < 4) return;
    const values = tds.map((td) => cellValue($, td));

    const looksLikeHeader = values.includes("교과") && values.includes("과목");
    if (looksLikeHeader) {
      const hasGradeCol = values.includes("석차등급");
      if (hasGradeCol) {
        active = true;
        trackIdx = values.indexOf("교과");
        gradeIdx = values.indexOf("석차등급");
      } else {
        active = false;
        trackIdx = -1;
        gradeIdx = -1;
      }
      return;
    }

    if (!active || trackIdx === -1 || gradeIdx === -1) return;
    if (values.length <= Math.max(trackIdx, gradeIdx)) return;

    const track = bucketOf(values[trackIdx]);
    const gradeNum = Number(values[gradeIdx]);
    if (!track || !Number.isFinite(gradeNum) || gradeNum <= 0) return;

    if (!sums[track]) sums[track] = { sum: 0, count: 0 };
    sums[track].sum += gradeNum;
    sums[track].count += 1;
  });

  const result: NeisParseResult["subjects"] = {};
  for (const [track, { sum, count }] of Object.entries(sums)) {
    if (count === 0) continue;
    (result as Record<string, SubjectGrade>)[track] = {
      avg: Math.round((sum / count) * 10) / 10,
      count,
    };
  }
  return result;
}

export function parseNeisHtml(html: string): NeisParseResult {
  const { school, grade } = extractSchoolGrade(html);
  const subjects = extractSubjectGrades(html);
  return { school, grade, subjects };
}
