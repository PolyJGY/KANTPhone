#!/usr/bin/env python3
"""
KANT OS server
---------------
Serves the Mobile OS shell (os/) and a small JSON API used by the
"pairing" widget on the lock/home screen.

Zero third-party dependencies on purpose: this is meant to run directly
on a fresh Raspberry Pi OS / Ubuntu Server install reached over
VSCode Remote-SSH, without a pip install step.

Usage:
    python3 server/server.py --host 0.0.0.0 --port 8420

Then, from VSCode (local machine or Remote-SSH), open:
    http://<raspberry-pi-ip>:8420/
"""

import argparse
import json
import os
import shutil
import subprocess
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OS_DIR = os.path.join(ROOT, "os")
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

START_TIME = time.time()

DEFAULT_CONFIG = {
    "device": "kant-phone-01",
    "host": "raspberrypi.local",
    "port": 8420,
    "platform": "raspberry-pi",
    "mode": "mobile-os",
    "ui_theme": "KANT Dark",
    "inspiration": "Volla Phone Plinius",
    "target_hardware": "Raspberry Pi",
    "runtime": "ubuntu-linux",
    "activation": "remote-ssh + systemd",
    "boot_mode": "kiosk",
}


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
        except (json.JSONDecodeError, OSError):
            pass
    return dict(DEFAULT_CONFIG)


def save_config(cfg):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def check_ssh_connected():
    """Best-effort: is the sshd service active? Works on systemd-based
    Raspberry Pi OS / Ubuntu; returns False (not an error) elsewhere."""
    if not shutil.which("systemctl"):
        return False
    try:
        out = subprocess.run(
            ["systemctl", "is-active", "ssh"],
            capture_output=True, text=True, timeout=2,
        )
        return out.stdout.strip() == "active"
    except Exception:
        return False


def find_executable(name):
    """Find an executable in PATH or common install locations."""
    if shutil.which(name):
        return shutil.which(name)

    for candidate in [
        os.path.join(os.path.expanduser("~"), ".local", "bin", name),
        os.path.join(os.path.expanduser("~"), "bin", name),
        os.path.join("/usr", "local", "bin", name),
        os.path.join("/usr", "bin", name),
        os.path.join("/snap", "bin", name),
    ]:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def check_docker_running():
    """Best-effort: is the docker daemon up and are containers running?"""
    docker_bin = find_executable("docker")
    if not docker_bin:
        return False
    try:
        out = subprocess.run(
            [docker_bin, "info"],
            capture_output=True, text=True, timeout=2,
        )
        return out.returncode == 0
    except Exception:
        return False


class KantOSHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=OS_DIR, **kwargs)

    def log_message(self, fmt, *args):
        # Quieter, single-line logs instead of the default verbose format.
        print(f"[kant-os] {self.address_string()} - {fmt % args}")

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            cfg = load_config()
            self._send_json({
                **cfg,
                "ssh_connected": check_ssh_connected(),
                "docker_running": check_docker_running(),
                "mobile_os_ready": check_ssh_connected() or check_docker_running(),
                "uptime_seconds": round(time.time() - START_TIME, 1),
            })
            return
        if parsed.path == "/api/config":
            self._send_json(load_config())
            return
        if parsed.path == "/api/manifest":
            cfg = load_config()
            self._send_json({
                "platform": cfg.get("platform", "raspberry-pi"),
                "mode": cfg.get("mode", "mobile-os"),
                "ui_theme": cfg.get("ui_theme", "KANT Dark"),
                "inspiration": cfg.get("inspiration", "Volla Phone Plinius"),
                "target_hardware": cfg.get("target_hardware", "Raspberry Pi"),
                "runtime": cfg.get("runtime", "ubuntu-linux"),
                "activation": cfg.get("activation", "remote-ssh + systemd"),
                "boot_mode": cfg.get("boot_mode", "kiosk"),
                "boot_url": f"http://{cfg.get('host', 'raspberrypi.local')}:{cfg.get('port', 8420)}",
            })
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/config":
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            try:
                incoming = json.loads(raw or b"{}")
            except json.JSONDecodeError:
                self._send_json({"error": "invalid json"}, status=400)
                return
            cfg = load_config()
            for key in ("device", "host", "port"):
                if key in incoming:
                    cfg[key] = incoming[key]
            save_config(cfg)
            self._send_json(cfg)
            return
        self._send_json({"error": "not found"}, status=404)


def main():
    parser = argparse.ArgumentParser(description="KANT OS server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8420, help="Bind port (default: 8420)")
    args = parser.parse_args()

    if not os.path.exists(CONFIG_PATH):
        save_config(DEFAULT_CONFIG)

    httpd = ThreadingHTTPServer((args.host, args.port), KantOSHandler)
    print(f"[kant-os] KANT Mobile OS Environment")
    print(f"[kant-os] serving {OS_DIR}")
    print(f"[kant-os] listening on http://{args.host}:{args.port}")
    print(f"[kant-os] open from another machine at http://<this-device-ip>:{args.port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[kant-os] shutting down")
        httpd.server_close()


if __name__ == "__main__":
    main()
