import json

HEARTBEAT = ": ping\n\n"
DONE = "event: done\ndata: {}\n\n"


def token(text: str) -> str:
    return f"data: {json.dumps(text)}\n\n"


def error(message: str) -> str:
    return f"event: error\ndata: {json.dumps({'message': message})}\n\n"
