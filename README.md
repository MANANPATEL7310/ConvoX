![ConvoX Header](https://capsule-render.vercel.app/api?type=venom&color=0:0ea5e9,100:8b5cf6&height=260&section=header&text=ConvoX&fontSize=64&fontColor=ffffff&animation=twinkling&fontAlignY=40&stroke=ffffff&strokeWidth=1)

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=600&color=8B5CF6&center=true&vCenter=true&width=900&lines=Realtime+video+meetings;Hybrid+WebRTC+P2P+and+SFU;Scheduling+and+email+reminders;Whiteboard+sync+and+live+captions;Host+controls+and+waiting+room)

![License](https://img.shields.io/github/license/MANANPATEL7310/ConvoX?style=flat-square)
![Stars](https://img.shields.io/github/stars/MANANPATEL7310/ConvoX?style=flat-square)
![Forks](https://img.shields.io/github/forks/MANANPATEL7310/ConvoX?style=flat-square)
![Issues](https://img.shields.io/github/issues/MANANPATEL7310/ConvoX?style=flat-square)
![Node](https://img.shields.io/badge/node-18%2B-4f46e5?style=flat-square)
![Vite](https://img.shields.io/badge/vite-7-8b5cf6?style=flat-square)
![LiveKit](https://img.shields.io/badge/livekit-SFU-6366f1?style=flat-square)
![WebRTC](https://img.shields.io/badge/webrtc-P2P-0ea5e9?style=flat-square)

---

## Overview
ConvoX is a full-stack video meeting platform with a hybrid WebRTC engine that runs P2P for small rooms and upgrades to SFU for larger rooms. It includes scheduling with email reminders, a synced whiteboard, live captions, chat, and robust host controls.

Live demo: [convo-x-gray.vercel.app](https://convo-x-gray.vercel.app)

---

## Table Of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Real Time Flow (P2P to SFU)](#real-time-flow-p2p-to-sfu)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Docker Setup](#docker-setup)
10. [Local Development](#local-development)
11. [Scripts](#scripts)
12. [Production Notes](#production-notes)
13. [Thanks](#thanks)
14. [Contributing](#contributing)
15. [License](#license)

---

## Features
- Hybrid WebRTC: P2P for small rooms, automatic SFU upgrade via LiveKit when participants exceed the threshold.
- Redis ephemeral state: connections, waiting room, chat history, and whiteboard snapshots are stored in Redis and cleaned when rooms end.
- Chat system: real-time messages, typing indicators, and file sharing over Socket.IO.
- Scheduling and reminders: schedule meetings, email invites and 10 min, 5 min, and start reminders with a background worker.
- Authentication: JWT cookie auth plus Google OAuth, with profile management.
- Whiteboard sync: host-led Excalidraw canvas with live state sync and view-only mode for others.
- Live captions: on-device speech recognition emits captions to all participants.
- Host controls: admit or reject, mute, camera off, and room moderation actions.
- Waiting room: enforced entry flow for scheduled meetings and host approval.
- Screen sharing: real-time screen share toggles with active presenter layout.

---

## System Architecture
```mermaid
flowchart LR
  subgraph Clients["Browser Clients"]
    A[Client A]
    B[Client B]
  end

  subgraph Backend["Node.js Backend"]
    API["Express REST API"]
    Socket["Socket.IO Server"]
    Worker["Schedule Worker"]
  end

  DB[(MongoDB)]
  REDIS["Redis<br/>Ephemeral State"]
  MAIL["Email Providers<br/>Resend + SMTP"]
  SFU["LiveKit SFU"]
  TURN["STUN/TURN"]

  A -->|HTTPS REST| API
  B -->|HTTPS REST| API
  A <-->|Socket.IO| Socket
  B <-->|Socket.IO| Socket

  A <-->|P2P media| B
  A -->|ICE/STUN/TURN| TURN
  B -->|ICE/STUN/TURN| TURN

  API -->|SFU tokens| SFU
  A -->|SFU media| SFU
  B -->|SFU media| SFU

  API --> DB
  API --> MAIL
  Socket -->|rooms, waiting room, chat, whiteboard| REDIS
  Worker --> DB
  Worker --> MAIL
```

---

## Real Time Flow (P2P to SFU)
```mermaid
sequenceDiagram
  participant H as "Host Client"
  participant A as "Participant"
  participant API as "REST API"
  participant S as "Socket.IO"
  participant L as LiveKit

  opt Scheduled meeting waiting room
    A->>S: waiting-room-join
    S-->>A: in-waiting-room
    H->>S: admit-user
    S-->>A: admitted
  end

  H->>S: join-call
  A->>S: join-call
  S->>H: set-mode p2p
  S->>A: set-mode p2p
  H->>S: signal (offer/ICE)
  S->>A: signal (offer/ICE)
  A->>S: signal (answer/ICE)
  S->>H: signal (answer/ICE)
  H->>A: WebRTC P2P media
  A->>H: WebRTC P2P media

  Note over S: Threshold crossed (3+ participants)
  S->>H: upgrade-to-sfu
  S->>A: upgrade-to-sfu
  H->>API: POST /livekit/token
  API-->>H: token + wsUrl
  A->>API: POST /livekit/token
  API-->>A: token + wsUrl
  H->>L: Connect to SFU
  A->>L: Connect to SFU
  H->>L: SFU media up
  L->>H: SFU media down
  A->>L: SFU media up
  L->>A: SFU media down
```

---

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, MUI, Framer Motion, LiveKit Components
- Backend: Node.js, Express, Socket.IO, Mongoose, Redis, LiveKit Server SDK
- Auth: JWT cookies, Google OAuth via Passport
- Realtime: WebRTC, STUN and TURN (Metered compatible)
- Email: Resend for scheduling reminders, SMTP for direct invites
- Whiteboard: Excalidraw

---

## Project Structure
```text
ConvoX/
  backend/
    controllers/
      socket/
    models/
    routes/
    utils/
    index.js
  frontend/
    src/
      components/
      hooks/
      pages/
      api/
      styles/
    public/
  docker-compose.yml
  README.md
```

---

## Getting Started
1. Install Node.js 18 or newer.
2. Create MongoDB and Redis instances.
3. Configure LiveKit (cloud or local via Docker).
4. Copy environment files and fill in values.
5. Install dependencies for backend and frontend.
6. Start backend, then frontend.

---

## Environment Variables
### Backend (`backend/.env`)
| Name | Required | Description | Example |
| --- | --- | --- | --- |
| MONGO_URL | Yes | MongoDB connection string | mongodb+srv://user:pass@cluster0.mongodb.net/db |
| PORT | Yes | API port | 8000 |
| NODE_ENV | Yes | Environment | development |
| FRONTEND_URL | Yes | Allowed CORS origins | http://localhost:5173,http://localhost:5174 |
| REDIS_URL | Yes | Redis connection URL | redis://localhost:6379 |
| TOKEN_KEY | Yes | JWT signing key | your_secret_key |
| LIVEKIT_API_KEY | Yes | LiveKit API key | devkey |
| LIVEKIT_API_SECRET | Yes | LiveKit API secret | secret |
| LIVEKIT_WS_URL | Yes | LiveKit websocket URL | ws://localhost:7880 |
| RESEND_API_KEY | Yes | Email provider for reminders | re_123456 |
| APP_URL | Yes | Frontend base URL | http://localhost:5173 |
| GOOGLE_CLIENT_ID | Optional | Google OAuth client id | your_client_id |
| GOOGLE_CLIENT_SECRET | Optional | Google OAuth client secret | your_client_secret |
| CLIENT_URL | Optional | Frontend URL for OAuth redirect | http://localhost:5173 |
| SMTP_EMAIL | Optional | SMTP address for invite emails | your_email@gmail.com |
| SMTP_PASSWORD | Optional | SMTP app password | your_app_password |

### Frontend (`frontend/.env`)
| Name | Required | Description | Example |
| --- | --- | --- | --- |
| VITE_API_URL | Yes | API base URL | http://localhost:8000/api/v1/users |
| VITE_SERVER_URL | Optional | Socket server URL | http://localhost:8000 |
| VITE_TURN_URLS | Optional | TURN server URLs | turn:global.relay.metered.ca:80,... |
| VITE_TURN_USERNAME | Optional | TURN username | your_turn_username |
| VITE_TURN_CREDENTIAL | Optional | TURN credential | your_turn_credential |

---

## Docker Setup
1. Start Redis and LiveKit using Docker Compose.
2. Configure backend LIVEKIT_WS_URL to ws://localhost:7880.

```bash
docker compose up -d
```

---

## Local Development
Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Scripts
- `backend`: `npm run dev` starts the API and Socket.IO server.
- `frontend`: `npm run dev` starts the Vite dev server.

---

## Production Notes
- Use HTTPS and secure cookies in production.
- Provide TURN credentials for reliable media connectivity.
- Configure LiveKit with production keys and public URL.
- Use a managed Redis service for reliable ephemeral state.
- Configure a verified email sender for reminders and invites.

---

## Thanks
Thanks for checking out ConvoX. If you build something cool with it, share feedback or open an issue — it helps a ton.

---

## Contributing
Contributions are welcome. Please open an issue or submit a pull request with a clear description.

---

## License
This project is licensed under the MIT License.

![Footer Wave](https://capsule-render.vercel.app/api?type=waving&color=0:8b5cf6,100:0ea5e9&height=120&section=footer&animation=twinkling)

<p align="right">~By : Manan patel</p>
