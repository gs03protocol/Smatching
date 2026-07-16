"""멘토가 '멘티 고르기'를 눌렀을 때 호출되는 Vercel Python 서버리스 함수.
criteria.subjectField 는 항상 "learnSubject" (멘티가 배우고 싶어하는 과목과 매칭).
"""
from http.server import BaseHTTPRequestHandler
import json
from scoring import score_candidates


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
