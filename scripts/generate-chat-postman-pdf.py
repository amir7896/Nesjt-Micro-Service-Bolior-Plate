#!/usr/bin/env python3
"""Generate Chat-Postman-Testing.pdf at the repository root."""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Chat-Postman-Testing.pdf"

NAVY = HexColor("#0f2744")
TEAL = HexColor("#0e7490")
INK = HexColor("#1e293b")
MUTED = HexColor("#475569")
CODE_BG = HexColor("#f1f5f9")
ROW = HexColor("#e8f4f8")


def styles():
    base = getSampleStyleSheet()
    return {
        "cover": ParagraphStyle(
            "cover",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=white,
            spaceAfter=6,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            textColor=HexColor("#dbeafe"),
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            textColor=TEAL,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "code": ParagraphStyle(
            "code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8,
            leading=11,
            textColor=INK,
            backColor=CODE_BG,
            leftIndent=4,
            rightIndent=4,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            textColor=MUTED,
            spaceAfter=8,
        ),
        "th": ParagraphStyle(
            "th",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=white,
        ),
        "td": ParagraphStyle(
            "td",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=INK,
        ),
        "tdc": ParagraphStyle(
            "tdc",
            parent=base["Normal"],
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            textColor=INK,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
        ),
    }


def table(headers, rows, col_widths):
    s = styles()
    data = [[Paragraph(h, s["th"]) for h in headers]]
    for row in rows:
        styled = []
        for i, cell in enumerate(row):
            styled.append(Paragraph(cell, s["tdc"] if i in (0, 1) else s["td"]))
        data.append(styled)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("BACKGROUND", (0, 1), (-1, -1), HexColor("#f8fafc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, ROW]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.3, HexColor("#cbd5e1")),
            ]
        )
    )
    return t


def bullets(items):
    s = styles()
    return ListFlowable(
        [ListItem(Paragraph(item, s["body"]), leftIndent=8) for item in items],
        bulletType="bullet",
        start="•",
        leftIndent=12,
        bulletFontName="Helvetica",
        bulletFontSize=9,
        bulletColor=TEAL,
    )


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 14 * mm, A4[0], 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, A4[1] - 9 * mm, "NestJS Microservices  ·  Testing, operations, and scale")
    canvas.setFillColor(HexColor("#e2e8f0"))
    canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(18 * mm, 5 * mm, "Gateway http://localhost:3002  ·  JWT required")
    canvas.drawRightString(A4[0] - 18 * mm, 5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def cover(canvas, doc):
    header_footer(canvas, doc)
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1] - 58 * mm, A4[0], 44 * mm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, A4[1] - 60 * mm, A4[0], 3 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 20)
    canvas.drawString(18 * mm, A4[1] - 36 * mm, "NestJS Microservices — full testing guide")
    canvas.setFillColor(HexColor("#dbeafe"))
    canvas.setFont("Helvetica", 10)
    canvas.drawString(
        18 * mm,
        A4[1] - 46 * mm,
        "Architecture, Docker, migrations, performance at scale, and Postman chat tests",
    )
    canvas.restoreState()


def build():
    s = styles()
    story = []
    story.append(Spacer(1, 42 * mm))

    story.append(Paragraph("1. What we built from scratch", s["h1"]))
    story.append(
        Paragraph(
            "This monorepo is a production-style NestJS 11 platform. Clients talk only to the "
            "<b>API Gateway</b> (HTTP + Socket.IO). The gateway never opens PostgreSQL. "
            "Auth, Users, and Chat are separate microservices. Each owns its own database. "
            "RabbitMQ carries request/response between gateway and workers. Redis is used for "
            "cache, access-token blacklist, online/offline presence, JWT validate cache, "
            "conversation member cache, and the Socket.IO Redis adapter (so several gateway "
            "processes share chat rooms).",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "Client\n"
            "  |\n"
            "  v\n"
            "API Gateway :3002   REST /api  +  Swagger /api/docs  +  Socket.IO /chat\n"
            "  |                 JWT, RBAC, validation, rate limit, inflight cap, timeouts\n"
            "  |\n"
            "  +-- RabbitMQ auth_queue  --> Auth Service :3001  --> PostgreSQL AUTH_POSTGRES_DATABASE\n"
            "  +-- RabbitMQ user_queue  --> User Service :3003  --> PostgreSQL USER_POSTGRES_DATABASE\n"
            "  +-- RabbitMQ chat_queue  --> Chat Service :3004  --> PostgreSQL CHAT_POSTGRES_DATABASE\n"
            "  |\n"
            "  +-- Redis  cache, blacklist, presence, Socket.IO pub/sub",
            s["code"],
        )
    )
    story.append(Paragraph("Features shipped", s["h2"]))
    story.append(
        table(
            ["Area", "What it does"],
            [
                ["Auth", "Register, login, refresh rotation, logout blacklist, /auth/me, change password, admin bootstrap"],
                ["Users", "Profiles keyed by auth account id, pagination, admin list/update/deactivate"],
                ["Chat REST", "Private + group, members, messages with type, typing, seen, unreadCount, presence"],
                ["Chat realtime", "Socket.IO /chat: message, typing, seen, presence, heartbeat"],
                ["Platform", "Helmet, CORS, compression, Pino, Swagger, health (RabbitMQ + Redis), request ids"],
                ["Data", "TypeORM migrations only (synchronize is off), soft deletes, partial unique indexes"],
            ],
            [32 * mm, 138 * mm],
        )
    )

    story.append(Paragraph("2. Docker, migrations, and run commands", s["h1"]))
    story.append(
        Paragraph(
            "Copy <font face='Courier'>.env.example</font> to <font face='Courier'>.env</font> and set secrets. "
            "Ports: Gateway <b>3002</b>, Auth <b>3001</b>, Users <b>3003</b>, Chat <b>3004</b>, "
            "Postgres <b>5432</b>, RabbitMQ <b>5672</b> / UI <b>15672</b>, Redis <b>6379</b>.",
            s["body"],
        )
    )
    story.append(Paragraph("Infrastructure (Postgres + RabbitMQ + Redis)", s["h2"]))
    story.append(
        Preformatted(
            "npm install\n"
            "sudo docker compose up -d\n"
            "# or:  npm run docker:up\n"
            "sudo docker compose ps\n"
            "sudo docker compose logs -f postgres rabbitmq redis",
            s["code"],
        )
    )
    story.append(
        Paragraph(
            "If this Postgres volume was created before chat existed, create the chat database once "
            "(names come from <font face='Courier'>.env</font> — example below uses nest_ms_chat):",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "sudo docker compose exec postgres psql -U \"$POSTGRES_USER\" -c 'CREATE DATABASE nest_ms_chat;'\n"
            "# If the role is root:  sudo docker exec -it nest-postgres psql -U root -c 'CREATE DATABASE nest_ms_chat;'",
            s["code"],
        )
    )
    story.append(Paragraph("Migrations (schema is never auto-synced)", s["h2"]))
    story.append(
        Preformatted(
            "npm run migration:run              # auth + users + chat\n"
            "npm run migration:auth:run\n"
            "npm run migration:users:run\n"
            "npm run migration:chat:run         # includes seen/type columns and scale indexes\n"
            "npm run migration:auth:show\n"
            "npm run migration:users:show\n"
            "npm run migration:chat:show\n"
            "npm run migration:chat:revert      # last chat migration only",
            s["code"],
        )
    )
    story.append(Paragraph("Start the four Nest apps", s["h2"]))
    story.append(
        Preformatted(
            "npm run start:dev                  # gateway + auth + users + chat (watch)\n"
            "npm run start:gateway\n"
            "npm run start:auth\n"
            "npm run start:users\n"
            "npm run start:chat\n"
            "npm run build && npm run start:gateway:prod   # production-style node dist/...",
            s["code"],
        )
    )
    story.append(
        Paragraph(
            "Health: <b>http://localhost:3002/api/health</b>. Swagger: <b>http://localhost:3002/api/docs</b>. "
            "RabbitMQ UI: <b>http://localhost:15672</b> (user/password from .env).",
            s["body"],
        )
    )
    story.append(Paragraph("Useful checks", s["h2"]))
    story.append(
        Preformatted(
            "curl -s http://localhost:3002/api/health\n"
            "npm test\n"
            "npm run docker:down                # stop compose, keep volumes\n"
            "python3 scripts/generate-chat-postman-pdf.py   # regenerate this PDF",
            s["code"],
        )
    )

    story.append(Paragraph("3. Heavy traffic — features implemented and how they work", s["h1"]))
    story.append(
        Paragraph(
            "A <b>single Node process cannot hold 1,000,000 open sockets</b>. That scale is reached by "
            "running many gateway workers behind a load balancer, many Auth/User/Chat consumers on "
            "RabbitMQ, and sized PostgreSQL/Redis. The features below are what the application does so "
            "a burst of concurrent API and chat calls is <b>served</b> instead of crashing the process "
            "or returning 503 for overflow.",
            s["body"],
        )
    )

    story.append(Paragraph("3.1 FIFO in-flight queue (no 503 for extra traffic)", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> At most <font face='Courier'>GATEWAY_MAX_INFLIGHT</font> (default 2000) "
            "RabbitMQ round-trips run at the same time. Extra HTTP/WS calls are not rejected. They "
            "wait in a first-in, first-out line and run as soon as a slot frees.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> <font face='Courier'>MicroserviceProxy.send()</font> calls "
            "<font face='Courier'>InflightLimiter.acquire()</font> before Auth/User/Chat RPC. If "
            "<font face='Courier'>active &lt; max</font>, the call starts immediately. If not, the "
            "request is pushed onto a waiter list. When a call finishes, "
            "<font face='Courier'>release()</font> wakes the oldest waiter (the slot is inherited — "
            "active stays at max). Only when the queue is empty does active decrease. Overflow is "
            "never turned into HTTP 503.",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "Request 1..2000  -> acquire() starts RPC immediately\n"
            "Request 2001+    -> acquire() waits in FIFO queue (client still connected)\n"
            "RPC finishes     -> release() -> next waiter starts (no 503)\n"
            "Worker hung > GATEWAY_TIMEOUT_MS -> 504 Gateway Timeout (stuck upstream, not overflow)",
            s["code"],
        )
    )

    story.append(Paragraph("3.2 Gateway workers (Node cluster)", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> <font face='Courier'>GATEWAY_WORKERS</font> (default 1 for local). Set "
            "<font face='Courier'>0</font> to fork one worker per CPU core. Each worker is a full "
            "API Gateway + Socket.IO process sharing port 3002 via Node cluster.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> <font face='Courier'>apps/api-gateway/src/main.ts</font> loads .env, then "
            "if it is the primary process and workers &gt; 1 it <font face='Courier'>cluster.fork()</font>s. "
            "A dead worker is restarted. Chat still works across workers because of the Redis adapter "
            "below. Locally leave this at 1 unless you are load-testing.",
            s["body"],
        )
    )

    story.append(Paragraph("3.3 Socket.IO Redis adapter", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Chat rooms, typing, seen, and presence events reach sockets even when users "
            "are connected to different gateway workers.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> <font face='Courier'>RedisIoAdapter</font> creates a Redis pub client and a "
            "duplicate sub client (<font face='Courier'>maxRetriesPerRequest: null</font>, required "
            "for pub/sub). Socket.IO uses <font face='Courier'>@socket.io/redis-adapter</font>. "
            "<font face='Courier'>server.to(['conversation:id','user:id']).emit(...)</font> is "
            "broadcast through Redis so every worker delivers it. If Redis is down at boot, the "
            "gateway logs a warning and runs single-instance mode instead of crashing.",
            s["body"],
        )
    )

    story.append(Paragraph("3.4 Cheap WebSocket connect + message fan-out", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Connecting 100,000 sockets must not each run “list my 100 conversations” "
            "over RabbitMQ. Inbox messages must still arrive if the user has not opened that chat.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> On connect the socket only joins <font face='Courier'>user:{authId}</font> "
            "and sets Redis presence. <font face='Courier'>chat:join</font> adds "
            "<font face='Courier'>conversation:{id}</font> when the user opens a thread. "
            "Send-message / seen RPC returns <font face='Courier'>recipientIds</font>. The gateway "
            "emits to the conversation room <b>and</b> every <font face='Courier'>user:{memberId}</font> "
            "room so the inbox updates without joining every chat on connect. "
            "<font face='Courier'>perMessageDeflate</font> is off (CPU), buffer max 100kb, ping 25s.",
            s["body"],
        )
    )

    story.append(Paragraph("3.5 JWT VALIDATE cache", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Every REST call used to RPC Auth Service VALIDATE. At high RPS that saturates "
            "<font face='Courier'>auth_queue</font>.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> After JWT signature + blacklist checks, "
            "<font face='Courier'>AuthSessionCache</font> reads "
            "<font face='Courier'>auth:validate:{userId}</font> in Redis (TTL "
            "<font face='Courier'>AUTH_VALIDATE_CACHE_SECONDS</font>, default 15). Miss → VALIDATE RPC, "
            "then cache. Logout and change-password delete the key so a revoked/deactivated user is "
            "not treated as valid for the rest of the TTL. WebSocket auth uses the same cache.",
            s["body"],
        )
    )

    story.append(Paragraph("3.6 Conversation member cache (typing)", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Typing events must not call GET_CONVERSATION (Postgres) on every keystroke.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> Redis SET <font face='Courier'>chat:cache:members:{conversationId}</font> "
            "(60s TTL) stores member account ids. Typing uses the SET when present; otherwise one "
            "GET_CONVERSATION fills it. Add/remove/leave members invalidates the key.",
            s["body"],
        )
    )

    story.append(Paragraph("3.7 Online / offline presence in Redis", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Presence is shared across gateway workers (not stored in process memory).",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> Connect: SADD socket id, SET online key with 45s TTL, delete lastSeen. "
            "Heartbeat refreshes the TTL. Last socket disconnect: DEL online, SET lastSeen ISO time. "
            "REST <font face='Courier'>GET /chat/presence/:userId</font> and conversation "
            "<font face='Courier'>members[].status</font> read these keys with a Redis pipeline "
            "(one round-trip for many members).",
            s["body"],
        )
    )

    story.append(Paragraph("3.8 PostgreSQL connection pool + chat indexes", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> One DB connection per request would exhaust Postgres under heavy traffic. "
            "Message history and unread counts must stay index scans, not table scans.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> TypeORM <font face='Courier'>extra.max</font> = "
            "<font face='Courier'>POSTGRES_POOL_MAX</font> (default 20), min 2, idle 30s, connect "
            "timeout 5s, statement_timeout 10s. Extra queries wait inside the <font face='Courier'>pg</font> "
            "pool (they are not failed). Migration "
            "<font face='Courier'>1730000002000-AddChatScaleIndexes</font> adds "
            "<font face='Courier'>(conversationId, createdAt DESC)</font> on messages and a composite "
            "unread index on conversation_members. Compose sets Postgres "
            "<font face='Courier'>max_connections=200</font> so several service pools fit.",
            s["body"],
        )
    )

    story.append(Paragraph("3.9 RabbitMQ backpressure", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Workers must not pull more jobs than they can finish; messages must survive a restart.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> Queues are durable; messages persistent. Workers "
            "<font face='Courier'>noAck: false</font> (manual ack) with "
            "<font face='Courier'>RABBITMQ_PREFETCH</font> default 16. The gateway ClientProxy keeps "
            "<font face='Courier'>noAck: true</font> on reply queues (manual ack there causes AMQP 406). "
            "Heartbeat 30s, reconnect 5s. Scale Auth/User/Chat processes to drain queues faster — "
            "do not put noAck:false on the gateway.",
            s["body"],
        )
    )

    story.append(Paragraph("3.10 Timeouts, body limits, throttle, trust proxy", s["h2"]))
    story.append(
        Paragraph(
            "<b>What:</b> Hung workers must not hold sockets forever. Huge bodies and login floods "
            "must not take the process down. Rate limit must see the real client IP behind nginx.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>How:</b> HTTP <font face='Courier'>TimeoutInterceptor</font> (default 10s) applies "
            "only to HTTP, not WebSocket. RPC timeout is min(GATEWAY_TIMEOUT_MS, 8000) and maps to "
            "<b>504</b> if the worker never answers. JSON/urlencoded bodies capped at 64kb. Socket.IO "
            "maxHttpBufferSize 100kb. Global throttle (THROTTLE_LIMIT / THROTTLE_TTL_SECONDS); "
            "login/register 8/min; refresh 20/min. Health is @SkipThrottle so probes never 429. "
            "Express <font face='Courier'>trust proxy</font> so throttle uses X-Forwarded-For. "
            "Helmet + compression on HTTP; WS compression off.",
            s["body"],
        )
    )

    story.append(Paragraph("3.11 Redis, logs, Docker heap", s["h2"]))
    story.append(
        Paragraph(
            "<b>How:</b> Gateway Redis: reconnect backoff, enableOfflineQueue false on the main "
            "client (fail fast, do not buffer millions of commands). Adapter pub/sub keeps "
            "offline queue on. Redis Compose uses <font face='Courier'>volatile-lru</font> so only "
            "TTL keys (presence, cache, blacklist) may be evicted. Production Pino "
            "<font face='Courier'>autoLogging: false</font> (access logs would dominate disk at high RPS). "
            "Service Dockerfiles set <font face='Courier'>NODE_OPTIONS=--max-old-space-size=512</font>.",
            s["body"],
        )
    )

    story.append(Paragraph("3.12 Env cheat sheet", s["h2"]))
    story.append(
        table(
            ["Variable", "Default", "Role under heavy traffic"],
            [
                ["GATEWAY_MAX_INFLIGHT", "2000", "Max concurrent RPCs; extras wait FIFO (no 503)"],
                ["GATEWAY_TIMEOUT_MS", "10000", "HTTP timeout; RPC cap 8s then 504"],
                ["GATEWAY_WORKERS", "1", "Cluster size; 0 = one worker per CPU"],
                ["AUTH_VALIDATE_CACHE_SECONDS", "15", "Skip Auth VALIDATE RPC on cache hit"],
                ["POSTGRES_POOL_MAX / MIN", "20 / 2", "Shared DB connections per service"],
                ["RABBITMQ_PREFETCH", "16", "Unacked jobs per worker"],
                ["THROTTLE_LIMIT / TTL", "60 / 60s", "Per-IP HTTP rate limit"],
                ["CACHE_TTL_SECONDS", "60", "Gateway HTTP cache TTL"],
            ],
            [52 * mm, 28 * mm, 90 * mm],
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            "Local soak test: keep GATEWAY_WORKERS=1. Raise POOL_MAX only if Postgres "
            "max_connections has room (Compose allows 200). In production: reverse proxy, several "
            "gateway replicas, extra chat-service consumers so chat_queue does not grow. "
            "Apply indexes with <font face='Courier'>npm run migration:chat:run</font>.",
            s["note"],
        )
    )

    story.append(Paragraph("4. Postman setup", s["h1"]))
    story.append(Paragraph("Create an environment (for example <b>Nest Chat Local</b>):", s["body"]))
    story.append(
        table(
            ["Variable", "Example", "Used for"],
            [
                ["baseUrl", "http://localhost:3002/api", "All REST requests"],
                ["accessTokenA", "(from login A)", "User A Authorization header"],
                ["accessTokenB", "(from login B)", "User B Authorization header"],
                ["userIdA", "(from /auth/me)", "Account id of user A"],
                ["userIdB", "(from /auth/me)", "Account id of user B"],
                ["conversationId", "(from create private)", "Chat id for messages / seen / typing"],
                ["messageId", "(from send message)", "Optional cursor for mark-seen"],
            ],
            [38 * mm, 52 * mm, 80 * mm],
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "On every request: <b>Authorization → Bearer Token</b> = "
            "<font face='Courier'>{{accessTokenA}}</font> or "
            "<font face='Courier'>{{accessTokenB}}</font>. "
            "Do not send a user profile id; chat <b>userId</b> is the auth account id "
            "from <font face='Courier'>GET /auth/me</font> (<b>data.id</b>).",
            s["body"],
        )
    )

    story.append(Paragraph("5. Login as two users", s["h1"]))
    story.append(
        Paragraph(
            "You need two accounts so you can test typing, seen, and presence. "
            "Register if needed, then log in twice (two Postman tabs or switch tokens).",
            s["body"],
        )
    )
    story.append(
        table(
            ["Step", "Method", "Path", "Body"],
            [
                ["1", "POST", "{{baseUrl}}/auth/register", '{"email":"a@test.com","password":"Passw0rd!","firstName":"Ada","lastName":"A"}'],
                ["2", "POST", "{{baseUrl}}/auth/register", '{"email":"b@test.com","password":"Passw0rd!","firstName":"Bob","lastName":"B"}'],
                ["3", "POST", "{{baseUrl}}/auth/login", '{"email":"a@test.com","password":"Passw0rd!"}'],
                ["4", "POST", "{{baseUrl}}/auth/login", '{"email":"b@test.com","password":"Passw0rd!"}'],
                ["5", "GET", "{{baseUrl}}/auth/me", "Bearer token A or B"],
            ],
            [16 * mm, 18 * mm, 58 * mm, 78 * mm],
        )
    )
    story.append(
        Paragraph(
            "From each login response save <b>data.accessToken</b>. From each "
            "<b>/auth/me</b> save <b>data.id</b> as userIdA / userIdB.",
            s["note"],
        )
    )
    story.append(Paragraph("Other HTTP routes (all JWT unless Public)", s["h2"]))
    story.append(
        table(
            ["Method", "Path", "Notes"],
            [
                ["POST", "{{baseUrl}}/auth/logout", "Blacklists access token; optional refreshToken body"],
                ["POST", "{{baseUrl}}/auth/refresh", "Rotate tokens (public, tighter throttle)"],
                ["PATCH", "{{baseUrl}}/auth/password", "Change password; current token is revoked"],
                ["GET", "{{baseUrl}}/users/me", "My profile (userId = auth id)"],
                ["GET", "{{baseUrl}}/users", "Admin: paginated profiles"],
                ["GET", "{{baseUrl}}/health", "Public; RabbitMQ + Redis; not rate-limited"],
                ["POST", "{{baseUrl}}/chat/conversations/:id/members", "Group: add members (owner/admin)"],
                ["DELETE", "{{baseUrl}}/chat/conversations/:id/members/:userId", "Group: remove member"],
                ["POST", "{{baseUrl}}/chat/conversations/:id/leave", "Leave group"],
                ["PATCH", "{{baseUrl}}/chat/conversations/:id", "Rename group"],
            ],
            [22 * mm, 78 * mm, 70 * mm],
        )
    )

    story.append(Paragraph("6. REST: conversations and messages (type)", s["h1"]))
    story.append(
        Paragraph(
            "Every message has a <b>type</b> field. The supported value today is "
            "<font face='Courier'>text</font>. Omit it and the server defaults to text.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Method", "Path", "Body / notes"],
            [
                [
                    "POST",
                    "{{baseUrl}}/chat/private",
                    'As user A: {"userId":"{{userIdB}}"}. Save data.id as conversationId.',
                ],
                [
                    "POST",
                    "{{baseUrl}}/chat/groups",
                    '{"name":"Weekend trip","memberIds":["{{userIdB}}"]}',
                ],
                [
                    "GET",
                    "{{baseUrl}}/chat/conversations",
                    "Check unreadCount and members[].status (online/offline).",
                ],
                [
                    "GET",
                    "{{baseUrl}}/chat/conversations/{{conversationId}}",
                    "Membership required. Members include lastReadAt and status.",
                ],
                [
                    "POST",
                    "{{baseUrl}}/chat/conversations/{{conversationId}}/messages",
                    '{"body":"Hello from A","type":"text"}. Save data.id as messageId.',
                ],
                [
                    "GET",
                    "{{baseUrl}}/chat/conversations/{{conversationId}}/messages",
                    "Newest first. Each item has type and seenBy (array of user ids).",
                ],
            ],
            [22 * mm, 78 * mm, 70 * mm],
        )
    )

    story.append(Paragraph("Expected send-message payload", s["h2"]))
    story.append(
        Preformatted(
            '{\n'
            '  "success": true,\n'
            '  "message": "Message sent successfully",\n'
            '  "data": {\n'
            '    "id": "<message uuid>",\n'
            '    "conversationId": "<conversation uuid>",\n'
            '    "senderId": "<user A id>",\n'
            '    "body": "Hello from A",\n'
            '    "type": "text",\n'
            '    "seenBy": [],\n'
            '    "createdAt": "2026-08-25T19:00:00.000Z"\n'
            '  }\n'
            "}",
            s["code"],
        )
    )

    story.append(Paragraph("7. Typing", s["h1"]))
    story.append(
        Paragraph(
            "Typing is a live event. REST is enough to exercise it from Postman; "
            "connected Socket.IO clients in that conversation receive <b>chat:typing</b>.",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "POST {{baseUrl}}/chat/conversations/{{conversationId}}/typing\n"
            "Authorization: Bearer {{accessTokenA}}\n"
            'Body: { "typing": true }\n\n'
            "Then send { \"typing\": false } when A stops typing.",
            s["code"],
        )
    )
    story.append(
        Paragraph(
            "To observe the event: open a Socket.IO request as user B (section 10) "
            "and listen for <b>chat:typing</b>. The payload is "
            "<font face='Courier'>{ conversationId, userId, typing }</font>.",
            s["body"],
        )
    )

    story.append(Paragraph("8. Seen receipts", s["h1"]))
    story.append(
        Paragraph(
            "Each member has a <b>lastReadAt</b> cursor. When B marks the chat as seen, "
            "messages whose <b>createdAt</b> is on or before that cursor list B in "
            "<b>seenBy</b> (the sender is never included).",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "# As user B, after A sent a message:\n"
            "POST {{baseUrl}}/chat/conversations/{{conversationId}}/seen\n"
            "Authorization: Bearer {{accessTokenB}}\n"
            "Body (mark everything now): {}\n"
            "or Body (up to one message): { \"messageId\": \"{{messageId}}\" }\n\n"
            "Then as user A:\n"
            "GET {{baseUrl}}/chat/conversations/{{conversationId}}/messages\n"
            "# data.items[n].seenBy should include userIdB\n"
            "GET {{baseUrl}}/chat/conversations\n"
            "# unreadCount for that chat should drop to 0 for user B",
            s["code"],
        )
    )
    story.append(
        Paragraph(
            "Socket.IO equivalent: emit <b>chat:seen</b> with "
            "<font face='Courier'>{ conversationId, messageId? }</font>. "
            "The server broadcasts <b>chat:seen</b> to the room.",
            s["note"],
        )
    )

    story.append(Paragraph("9. Online / offline presence", s["h1"]))
    story.append(
        Paragraph(
            "A user is <b>online</b> while they hold at least one authenticated Socket.IO "
            "connection on namespace <b>/chat</b>. Disconnect (or token expiry) sets them "
            "<b>offline</b> and stores <b>lastSeenAt</b> in Redis. REST presence does not "
            "require a socket — it only reads that Redis state.",
            s["body"],
        )
    )
    story.append(
        Preformatted(
            "GET {{baseUrl}}/chat/presence/{{userIdB}}\n"
            "Authorization: Bearer {{accessTokenA}}\n\n"
            "Offline example:\n"
            '{ "data": { "userId": "<B>", "status": "offline", "lastSeenAt": null } }\n\n'
            "After B connects Socket.IO /chat:\n"
            '{ "data": { "userId": "<B>", "status": "online", "lastSeenAt": null } }\n\n'
            "After B disconnects:\n"
            '{ "data": { "userId": "<B>", "status": "offline", "lastSeenAt": "<ISO time>" } }',
            s["code"],
        )
    )
    story.append(
        Paragraph(
            "Conversation list and get-conversation also overlay live status on "
            "<b>members[].status</b> and <b>members[].lastSeenAt</b>. "
            "Clients should listen for <b>chat:presence</b> so the UI updates without polling.",
            s["body"],
        )
    )

    story.append(Paragraph("10. Socket.IO in Postman", s["h1"]))
    story.append(
        Paragraph(
            "Postman supports Socket.IO (not the generic WebSocket request type). "
            "New → Socket.IO. Use two requests (user A and user B) if you want to watch "
            "events from both sides.",
            s["body"],
        )
    )
    story.append(bullets([
        "<b>Server URL:</b> <font face='Courier'>http://localhost:3002</font>  (no /api prefix)",
        "<b>Namespace:</b> <font face='Courier'>/chat</font>",
        "<b>Handshake → Auth:</b> JSON <font face='Courier'>{\"token\":\"{{accessTokenB}}\"}</font>  "
        "You can also send header <font face='Courier'>Authorization: Bearer {{accessTokenB}}</font>.",
        "Connect. The socket joins only <font face='Courier'>user:{yourId}</font> (no list-all-chats query).",
        "Emit <b>chat:join</b> with <font face='Courier'>{\"conversationId\":\"{{conversationId}}\"}</font> "
        "so typing/presence use the conversation room. Inbox messages still arrive on the user room.",
        "Listen for events: <b>chat:message</b>, <b>chat:typing</b>, <b>chat:seen</b>, <b>chat:presence</b>.",
        "Keep the connection alive with emit <b>chat:heartbeat</b> every ~20 seconds (refreshes the online TTL).",
    ]))
    story.append(Paragraph("Client → server events", s["h2"]))
    story.append(
        table(
            ["Event", "Payload", "What it does"],
            [
                ["chat:join", '{"conversationId":"<uuid>"}', "Join a conversation room"],
                [
                    "chat:message",
                    '{"conversationId":"<uuid>","body":"Hi","type":"text"}',
                    "Send a message; room gets chat:message",
                ],
                [
                    "chat:typing",
                    '{"conversationId":"<uuid>","typing":true}',
                    "Broadcast typing true/false",
                ],
                [
                    "chat:seen",
                    '{"conversationId":"<uuid>","messageId":"<uuid>"}',
                    "Mark seen; room gets chat:seen",
                ],
                ["chat:heartbeat", "(empty)", "Stay online (TTL refresh)"],
            ],
            [38 * mm, 78 * mm, 54 * mm],
        )
    )
    story.append(Paragraph("Server → client events", s["h2"]))
    story.append(
        table(
            ["Event", "Payload shape"],
            [
                ["chat:message", "Message object (id, body, type, seenBy, senderId, …)"],
                ["chat:typing", "{ conversationId, userId, typing }"],
                ["chat:seen", "{ conversationId, userId, lastReadAt, messageId }"],
                ["chat:presence", "{ conversationId, userId, status: online|offline, lastSeenAt }"],
            ],
            [42 * mm, 128 * mm],
        )
    )

    story.append(Paragraph("11. Suggested Postman sequence", s["h1"]))
    story.append(bullets([
        "Login A and B. Save tokens and user ids.",
        "As A: POST /chat/private with B’s userId. Save conversationId.",
        "GET /chat/presence/{{userIdB}} → expect <b>offline</b>.",
        "Connect Socket.IO as B with B’s token.",
        "GET /chat/presence/{{userIdB}} → expect <b>online</b>. GET conversations as A and confirm members[].status.",
        "As A REST: POST typing true, then send a text message. B’s Socket.IO tab should show chat:typing then chat:message.",
        "As B REST or Socket.IO: mark seen. As A, GET messages and confirm seenBy includes B.",
        "Disconnect B’s Socket.IO. GET presence → <b>offline</b> with lastSeenAt set. A should receive chat:presence.",
    ]))

    story.append(Paragraph("12. Common mistakes", s["h1"]))
    story.append(bullets([
        "Using a user <b>profile</b> id instead of the auth account id from /auth/me.",
        "Pointing Socket.IO at <font face='Courier'>http://localhost:3002/api/chat</font> — the namespace is "
        "<font face='Courier'>/chat</font> on the gateway host, not under the REST prefix.",
        "Creating a raw WebSocket request in Postman instead of a <b>Socket.IO</b> request.",
        "Expecting REST GET /chat/presence to flip to online without a Socket.IO connection.",
        "Forgetting <font face='Courier'>npm run migration:chat:run</font> (seen/type columns and scale indexes).",
        "Calling chat on auth :3001 or users :3003 — only the gateway (:3002) exposes HTTP and Socket.IO.",
    ]))

    story.append(Paragraph("13. Quick reference", s["h1"]))
    story.append(
        table(
            ["Feature", "REST", "Socket.IO"],
            [
                ["Message type", 'POST .../messages  { "type": "text" }', "chat:message  type: text"],
                ["Typing", "POST .../typing  { typing }", "emit/listen chat:typing"],
                ["Seen", "POST .../seen  { messageId? }", "emit/listen chat:seen"],
                ["Online / offline", "GET /chat/presence/:userId", "listen chat:presence; connect = online"],
            ],
            [36 * mm, 72 * mm, 62 * mm],
        )
    )
    story.append(Spacer(1, 6 * mm))
    story.append(
        Paragraph(
            "Swagger UI at http://localhost:3002/api/docs also covers these REST routes. "
            "Authorize there with the same access token if you prefer the browser over Postman.",
            s["note"],
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=20 * mm,
        bottomMargin=16 * mm,
        title="NestJS Microservices — testing and operations guide",
        author="NestJS Microservices",
    )
    doc.build(story, onFirstPage=cover, onLaterPages=header_footer)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    build()
