# KANT OS — Raspberry Pi 배포 가이드

README.md 3장(대상)에서 정의한 순서를 그대로 따릅니다:
**VSCode Remote-SSH → Ubuntu Linux Terminal (또는 Docker) → IP:PORT 실행 확인.**

## 0. 준비물

- Raspberry Pi (Raspberry Pi OS 또는 Ubuntu Server, 64-bit 권장)
- Pi 에 미리 설정된 SSH (`sudo raspi-config` → Interface Options → SSH → Enable)
- 로컬 PC의 VSCode + **Remote - SSH** 확장

## 1. VSCode Remote-SSH 로 접속

1. VSCode 명령 팔레트(`Ctrl/Cmd+Shift+P`) → `Remote-SSH: Connect to Host...`
2. `pi@<라즈베리파이 IP>` 입력 (예: `pi@192.168.0.42`)
3. 연결되면 VSCode 창이 Pi 위에서 열립니다. 이후 모든 터미널 명령은 Pi의 Ubuntu Linux Terminal 에서 실행됩니다.

## 2. 저장소 가져오기

```bash
git clone <이 저장소 URL> KANTPhone
cd KANTPhone
```

## 3. 서버 실행 (가장 간단한 방법)

서버는 표준 라이브러리만 사용하므로 `pip install` 이 필요 없습니다.

```bash
python3 server/server.py --host 0.0.0.0 --port 8420
```

터미널에 다음과 같이 나오면 정상입니다.

```
[kant-os] listening on http://0.0.0.0:8420
[kant-os] open from another machine at http://<this-device-ip>:8420
```

로컬 PC 브라우저(또는 VSCode의 Simple Browser)에서 `http://<Pi IP>:8420` 를 열면
KANT OS 잠금화면이 뜹니다. 상단 상태바와 홈 화면의 페어링 카드가 초록색(연결됨)으로
바뀌면 IP:PORT 연결이 성공한 것입니다.

## 4. Docker로 실행 (선택)

README.md 3장에서 언급한 대로 Docker 로도 동일하게 실행할 수 있습니다.

```bash
cd deploy
docker compose up -d --build
```

컨테이너 로그 확인:

```bash
docker compose logs -f kant-os
```

## 5. 부팅 시 자동 실행 (systemd)

Pi 를 켤 때마다 수동으로 서버를 켜지 않도록 등록합니다.

```bash
sudo cp deploy/kant-os.service /etc/systemd/system/kant-os.service
sudo systemctl daemon-reload
sudo systemctl enable --now kant-os.service
sudo systemctl status kant-os.service
```

더 편리하게 한 번에 적용하려면:

```bash
sudo bash deploy/activate.sh
```

이 스크립트는 systemd 서비스와 kiosk autostart 를 함께 등록해, Raspberry Pi 부팅 시 바로 KANT OS 가 뜨도록 설정합니다.

## 6. 키오스크(전체화면 폰 화면)로 부팅 — 선택

Pi 에 화면이 직접 연결되어 있고 데스크톱 환경(Raspberry Pi OS Desktop)을 쓴다면,
아래 autostart 항목을 추가하면 부팅 후 자동으로 KANT OS 가 전체화면으로 열립니다.

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/kant-os-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=KANT OS Kiosk
Exec=chromium-browser --kiosk --app=http://localhost:8420
EOF
```

## 7. 정리 — README.md 와의 대응 관계

| README.md 항목 | 이 저장소의 구현 |
|---|---|
| 2장 환경: VSCode 로 개발, Ubuntu Linux 로 실행 | `os/`, `server/` 를 VSCode Remote-SSH 세션에서 편집·실행 |
| 2장 환경: Volla Phone Plinius 에서 영감 | `os/style.css` 의 다크 미니멀 테마, 잠금화면/홈화면 구조 |
| 2장 환경: kant.spartaclub.kr 컬러 활용 | 다크 그래파이트 배경 + 민트 accent, Space Grotesk/JetBrains Mono 타이포 |
| 3장 대상: IP:PORT 실행이 두려움 → 해결 | 홈 화면의 "RASPBERRY PI LINK" 카드 + `/api/status` 로 실시간 확인 |
| 3장 대상: Docker 또는 Remote-SSH | `deploy/Dockerfile`, `deploy/docker-compose.yml`, 이 문서 1~4장 |
| 4장 결론: Raspberry Pi 등록 여부 확인 | 서버가 `systemctl is-active ssh`, `docker info` 를 확인해 상태바에 표시 |
