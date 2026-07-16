"""매칭 후보자 스코어링 로직 (Vercel Python 서버리스 함수 + 로컬 CLI 겸용).

Express 백엔드가 PlanetScale에서 조건에 맞는 준비완료 후보자 목록을 조회한 뒤,
이 스코어러에 (criteria, candidates)를 넘기면 점수순으로 정렬된 배열을 돌려준다.
Python 쪽에서는 DB에 직접 접근하지 않는다.
"""
import json
import sys


def _time_ranges_overlap(a, b):
    def to_min(hhmm):
        h, m = hhmm.split(":")
        return int(h) * 60 + int(m)

    if a.get("day") != b.get("day"):
        return False
    a_start, a_end = to_min(a["start"]), to_min(a["end"])
    b_start, b_end = to_min(b["start"]), to_min(b["end"])
    return a_start < b_end and b_start < a_end


def score_candidates(criteria, candidates):
    subject = criteria.get("subject")
    grade = criteria.get("grade")
    track = criteria.get("track")
    school = criteria.get("school")
    city = criteria.get("city")
    time_slots = criteria.get("timeSlots") or []
    subject_field = criteria.get("subjectField")  # "teachSubject" | "learnSubject"

    scored = []
    for candidate in candidates:
        target = candidate.get(subject_field) or {}
        if target.get("subject") != subject or target.get("track") != track or target.get("grade") != grade:
            continue  # 과목 일치는 필수 조건

        score = 100  # 필수 조건 통과 기본 점수

        if school and candidate.get("schoolName") == school:
            score += 20
        if city and candidate.get("city") == city:
            score += 10
        if time_slots:
            cand_slots = candidate.get("availableTimes") or []
            if any(_time_ranges_overlap(a, b) for a in time_slots for b in cand_slots):
                score += 15

        scored.append({**candidate, "_score": score})

    scored.sort(key=lambda c: c["_score"], reverse=True)
    return scored


def _run_cli():
    # Windows에서 파이프로 문자열을 넘기면 UTF-8 BOM이 붙는 경우가 있어 utf-8-sig로 디코딩한다.
    raw = sys.stdin.buffer.read().decode("utf-8-sig")
    payload = json.loads(raw)
    result = score_candidates(payload.get("criteria", {}), payload.get("candidates", []))
    # sys.stdout의 텍스트 인코딩은 OS 로캘(Windows에서는 cp949/cp1252 등)에 따라 달라져
    # 한글이 깨질 수 있으므로, buffer에 UTF-8 바이트를 직접 써서 인코딩을 고정한다.
    out = json.dumps(result, ensure_ascii=False).encode("utf-8")
    sys.stdout.buffer.write(out)


if __name__ == "__main__":
    _run_cli()
