#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_SOURCE="$ROOT_DIR/deploy/kant-os.service"
SERVICE_TARGET="/etc/systemd/system/kant-os.service"
AUTOSTART_DIR="$HOME/.config/autostart"
AUTOSTART_FILE="$AUTOSTART_DIR/kant-os-kiosk.desktop"

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run with sudo."
  echo "Example: sudo bash deploy/activate.sh"
  exit 1
fi

mkdir -p "$AUTOSTART_DIR"
cp "$SERVICE_SOURCE" "$SERVICE_TARGET"

python_bin="$(command -v python3 || true)"
if [[ -n "$python_bin" ]]; then
  sed -i "s|/usr/bin/python3|$python_bin|g" "$SERVICE_TARGET"
fi
sed -i "s|/home/pi/KANTPhone|$ROOT_DIR|g" "$SERVICE_TARGET"

cat > "$AUTOSTART_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=KANT OS Kiosk
Exec=$(command -v chromium-browser || command -v chromium || command -v google-chrome || echo "x-www-browser") --kiosk --app=http://localhost:8420
Terminal=false
EOF

systemctl daemon-reload
systemctl enable --now kant-os.service

printf '\nKANT OS activation complete.\n'
printf 'Service: %s\n' "$SERVICE_TARGET"
printf 'Autostart: %s\n' "$AUTOSTART_FILE"
printf 'Open: http://localhost:8420\n'
