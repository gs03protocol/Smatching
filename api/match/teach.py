"""멘토가 '멘티 고르기'를 눌렀을 때 호출되는 Vercel Python 서버리스 함수.
criteria.subjectField 는 항상 "learnSubject" (멘티가 배우고 싶어하는 과목과 매칭).

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

        score = 100

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


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        criteria = {**body.get("criteria", {}), "subjectField": "learnSubject"}
        result = score_candidates(criteria, body.get("candidates", []))
        payload = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
