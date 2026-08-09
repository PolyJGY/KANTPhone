import os
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class ManageDockerScriptTest(unittest.TestCase):
    def test_manage_docker_falls_back_without_docker(self):
        result = subprocess.run(
            ["bash", "deploy/manage-docker.sh", "up"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=20,
        )

        try:
            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            output = result.stdout + result.stderr
            self.assertTrue(
                "KANT OS server" in output or "Docker Compose not available" in output,
                msg=output,
            )
        finally:
            subprocess.run(
                ["bash", "deploy/manage-docker.sh", "down"],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=20,
            )


if __name__ == "__main__":
    unittest.main()
