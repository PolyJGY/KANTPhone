import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "server", "config.json")


def test_default_config_has_mobile_os_fields():
    if not os.path.exists(CONFIG_PATH):
        raise AssertionError("server/config.json must exist")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    required = {
        "device",
        "host",
        "port",
        "platform",
        "mode",
        "ui_theme",
        "inspiration",
        "target_hardware",
    }
    missing = sorted(required - set(config))
    assert not missing, f"Missing config fields: {missing}"
    assert config["mode"] == "mobile-os"
    assert config["platform"] == "raspberry-pi"
    assert config["inspiration"] == "Volla Phone Plinius"
