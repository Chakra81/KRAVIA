import requests

data = {
    "title": "Python full stack",
    "description": "Python loops",
    "course": "3",
    "duration": 60,
    "scheduled_time": "2026-06-08T15:43:00.000Z",
    "email": "chakravenikatari05@gmail.com"
}
res = requests.post("http://localhost:8000/api/live-sessions/", json=data)
print(res.status_code)
print(res.text)
