import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_manage_docker_falls_back_without_docker():
    result = subprocess.run(
        ["bash", "deploy/manage-docker.sh", "up"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=20,
    )

    try:
        assert result.returncode == 0, result.stdout + result.stderr
        assert "KANT OS server" in result.stdout or "Fallback" in result.stdout
    finally:
        subprocess.run(
            ["bash", "deploy/manage-docker.sh", "down"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=20,
        )
