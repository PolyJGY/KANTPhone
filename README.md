# KANT Phone

작성인 : 정구영 · 작성일 : 2026년 08월 08일 · 내용 : Mobile OS Development
구현 : Mobile KANT OS Environment (Raspberry Pi 대상 Web 기반 Phone Shell)

---

## 0. 이 저장소의 구성

README 원문(1~4장, 아래 유지)의 요구사항을 다음과 같이 구현했습니다.

```
KANTPhone/
├── README.md              ← 이 파일 (기획 원문 + 구현 개요)
├── os/                     ← Mobile OS 셸 (VSCode 에서 개발하는 실제 UI)
│   ├── index.html          잠금화면 · 홈화면 · 앱 화면 마크업
│   ├── style.css           KANT 디자인 토큰 (Volla Plinius 영감의 다크 테마)
│   └── app.js               화면 전환, 앱 레지스트리, 페어링 상태 폴링
├── server/                 ← Ubuntu Linux Terminal 에서 실행하는 서버
│   ├── server.py            표준 라이브러리만 사용하는 IP:PORT 서버 + 상태 API
│   └── config.json          기기 이름 / HOST / PORT 설정
└── deploy/                 ← Raspberry Pi 배포 (Docker · Remote-SSH · systemd)
    ├── Dockerfile
    ├── docker-compose.yml
    ├── kant-os.service      부팅 시 자동 실행 (systemd)
    └── SETUP.md             VSCode Remote-SSH → 실행 확인까지 단계별 가이드
```

## 1. 빠르게 실행해보기 (로컬)

Raspberry Pi 가 아직 없어도, 아무 Ubuntu/Linux/Mac 머신에서 바로 셸을 확인할 수 있습니다.

```bash
python3 server/server.py --host 0.0.0.0 --port 8420
```

브라우저에서 `http://localhost:8420` 접속 → 잠금화면이 뜨면 위로 밀어 홈화면으로 진입합니다.
홈 화면의 **RASPBERRY PI LINK** 카드가 이 프로젝트의 핵심 관심사였던
"IP:PORT 로 정상 연결되었는가"를 실시간으로 보여줍니다.

Raspberry Pi 에 실제로 올리는 전체 절차(VSCode Remote-SSH, Docker, systemd 자동 실행)는
[`deploy/SETUP.md`](deploy/SETUP.md) 를 따르세요.

## 2. 디자인 방향

- **색**: 그래파이트에 가까운 다크 배경(`#0E1013`) + 민트 accent(`#5EEAD4`), 경고/알림용 웜 amber(`#FFB37B`).
  kant.spartaclub.kr 의 어둡고 절제된 AI-native 톤을 참고하되, 폰 OS 다운 대비와 가독성을 우선했습니다.
- **타이포**: 시계·앱 라벨은 Space Grotesk, 본문은 Inter, IP/PORT·터미널 로그처럼
  "정확히 읽어야 하는" 값은 JetBrains Mono — 이 프로젝트가 VSCode/터미널 중심 개발임을 UI에도 드러냅니다.
- **레이아웃**: Volla Phone Plinius 처럼 군더더기 없는 잠금화면 → 홈 그리드 → 독(dock) 구조.
- **시그니처 요소**: README 3장에서 저자가 가장 두려워한 지점 — "IP:PORT 실행 여부 확인" — 을
  홈 화면 상단의 실시간 페어링 카드로 만들었습니다. SSH(`systemctl is-active ssh`)와
  Docker(`docker info`) 상태를 서버가 직접 확인해 상태바 점(dot)과 카드 배지로 보여줍니다.

## 3. 앱

| 앱 | 내용 |
|---|---|
| 페어링 | SSH/Docker 연결 상태, 부팅 로그(clone → server 실행 → docker compose) |
| 설정 | 기기 이름 / HOST / PORT 를 직접 입력해 다른 Pi 로 즉시 전환 |
| 배포 문서 | `deploy/SETUP.md` 요약과 README 원문 항목 ↔ 구현 대응표 |
| KANT 소개 | 프로젝트 배경, 작성인/작성일, 디자인·OS 영감 출처 |
| 메모/시계/카메라/브라우저 | 다음 단계 로드맵 자리 표시 (자리만 마련) |

## 4. 다음 단계

- `os/` 를 실제 Raspberry Pi 터치스크린에서 확인하며 터치 제스처(스와이프 잠금해제 등) 다듬기
- Volla Plinius 처럼 알림 셰이드, 앱 드로어 스와이프 제스처 추가
- `server/server.py` 의 상태 API 를 실제 Wi-Fi/블루투스 페어링 로직과 연결
- Raspberry Pi Compute Module 기반 실물 하드웨어 설계로 확장

---

## 원문 (기획서)

### 1. 정의

오늘은 KANT Phone 에 관해서 Raspberry Pi Computer 라는 컴퓨터 환경을 호환할 수 있는 작은 칩에 Ubuntu Linux 언어 및 기술 에 의한 Mobile OS 를 먼저 개발하는 데에 초점을 두고 있다. 그리고 KANT Phone 의 OS 를 개발할 환경은 VSCode 이고, 개발 언어는 Ubuntu Linux 이지만 환경은 전혀 Ubuntu 가 아니라 KANT 라는 새로운 Mobile OS 를 개발 하는 데에 초점을 맞출 것이다. 폰 하드웨어 자체를 개발하기 보다는 Mobile OS Environment 를 개발하는 것이어서 소프트웨어의 측면이 대두되어지고, 후에는 이 환경을 Raspberry Pi 안에 탑재하는 것을 목표로 할 것이다. 그래서 다음이 환경인 것이다.

### 2. 환경

우선 Mobile OS 자체의 전체적인 컬러가 중요한데, 현재 저자가 이수하고 있는 KANT 라는 취업 이력 개발 환경의 웹 페이지인 https://kant.spartaclub.kr/ 의 사양을 활용해도 적절할 것으로 판단하고 있다. 좀 더 디테일 하게 해당 Mobile OS 가 영감 받을 곳은 Volla Phone Plinius 의 Mobile OS 이고, 그럼에도 이 환경을 Raspberry Pi 에 적용하는 것까지 고려하면 후에는 Raspberry Pi Computer 를 소화할 Phone 도 만들어야 하는 것이다. 그전에는 아예 Mobile OS 를 연동시킬 IP 주소, 그리고 PORT 주소까지 완성이 되야하는 것이다. 이렇게 환경에 관해 다루게 되었고, 대상 구현은 VSCode 에서 이루어진다.

### 3. 대상

나는 구현하고 나서 IP : PORT 를 실행 시킬 때가 가장 두렵다. 그래서 VSCode 에서 Mobile OS 주소로 실행시킬 전략은 찾고 있고, 그전에 이를 시행한 전적을 따라서 이를 실행할 수 있음을 확신하고 있다. 결국 이는 VSCode 의 Agent Ai 인 Copilot 의 몫이고, 이를 시행해 달라고 이렇게 작성하고 있는 것이다. 이후에는 이를 구현하는 언어가 가장 중요한데, Ubuntu Linux Terminal 을 활용할 것을 요청하는 바이고, 이는 사실 Docker 에서 가능하고, 또한 Remote - SSH 를 활용하면 가능하다고 한다. 여기서 위의 안건까지 다 해결 된 것이다. 이들이 해당 컴퓨터에 있다는 것을 고려해서 프로젝트를 진행할 거다.

### 4. 결론

어쨌든 Mobile Phone 이 아니라, Mobile OS 를 만드는 거지만, 이를 필두로 해서 KANT Phone 을 만들려고 하고 있고, 본 프로젝트에서는 어디까지나 Mobile OS 를 만드는 것을 목표로 하고 있다. 결론적으로 VSCode 에서 Raspberry Pi 에 IP : PORT 로 등록할, 그리고 Ubuntu Linux Terminal 시스템, 즉, Remote-SSH 를 토대로 구현된 Mobile OS 를 만든 다는 것이다. 그리고 이를 VSCode 에서 시각적으로 확인하고서 이것이 Raspberry Pi 에 등록되어도 되는지의 여부를 다룰 것이라는 것이다. 이것이 전부이고, 이를 성공했을 때 정말로 KANT Phone 이나 더 한 결과물로도 나올 수 있다고 장담할 수 있는 것이다.
