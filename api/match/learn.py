"""멘티가 '멘토 고르기'를 눌렀을 때 호출되는 Vercel Python 서버리스 함수.
criteria.subjectField 는 항상 "teachSubject" (멘토가 가르칠 수 있는 과목과 매칭).

Vercel Python 런타임은 함수 파일을 독립적으로 번들링해서 옆 파일(scoring.py)을
모듈로 import하지 못하므로, 스코어링 로직을 이 파일 안에 그대로 둔다.
"""
from http.server import BaseHTTPRequestHandler
import json


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
    subject_field = criteria.get("subjectField")

    scored = []
    for candidate in candidates:
        target = candidate.get(subject_field) or {}
        if target.get("subject") != subject or target.get("track") != track or target.get("grade") != grade:
            continue

        # 매칭된 과목(track) 기준으로, 멘토의 등급이 멘티보다 같거나 좋아야만(숫자가 작거나 같아야만) 매칭한다.
        requester_grade = criteria.get("requesterTrackGrade")
        candidate_grade = ((candidate.get("subjectGrades") or {}).get(track) or {}).get("avg")
        if requester_grade is None or candidate_grade is None:
            continue  # 둘 중 한쪽이라도 해당 과목 등급 정보가 없으면 실력 비교가 불가능해 제외
        if subject_field == "learnSubject":  # 요청자가 멘토(가르치기)
            mentor_grade, mentee_grade = requester_grade, candidate_grade
        else:  # subject_field == "teachSubject", 요청자가 멘티(배우기)
            mentor_grade, mentee_grade = candidate_grade, requester_grade
        if mentor_grade > mentee_grade:
            continue  # 등급 숫자가 클수록 성적이 낮으므로, 멘토가 멘티보다 못하면 제외

        score = 100

        if school and candidate.get("schoolName") == school:
            score += 20  # 검색 시 명시적으로 입력한 학교 조건과 일치
        if city and candidate.get("city") == city:
            score += 10  # 검색 시 명시적으로 입력한 지역 조건과 일치

        requester_school = criteria.get("requesterSchool")
        requester_city = criteria.get("requesterCity")
        if requester_school and candidate.get("schoolName") == requester_school:
            score += 20  # 필터를 안 넣어도, 나와 같은 학교면 자동으로 가산점
        if requester_city and candidate.get("city") == requester_city:
            score += 10  # 나와 같은 지역이면 자동으로 가산점

        if time_slots:
            cand_slots = candidate.get("availableTimes") or []
            if any(_time_ranges_overlap(a, b) for a in time_slots for b in cand_slots):
                score += 15

        scored.append({**candidate, "_score": score})

    scored.sort(key=lambda c: c["_score"], reverse=True)
    return scored


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        criteria = {**body.get("criteria", {}), "subjectField": "teachSubject"}
        result = score_candidates(criteria, body.get("candidates", []))
        payload = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
