# KANT Phone Mobile OS Flow

## Start of the Mobile OS
1. Power on the Raspberry Pi.
2. Ubuntu Linux boots up.
3. The KANT OS server starts.
4. The browser opens the mobile UI.
5. The lock screen appears.

## Middle of the Flow
1. The user sees the lock screen.
2. The status card shows device, host, and connection information.
3. The user unlocks the screen.
4. The home screen appears.

## End of the Mobile OS Experience
1. The home screen becomes ready for use.
2. The user can access the pairing view, settings, and system information.
3. The environment behaves like a simple phone OS.
4. The system is now fully activated and ready for use.

## Commands
```bash
cd ~/KANTPhone
sudo bash deploy/activate.sh
sudo reboot
```

## Access URL
```bash
http://<pi-ip>:8420
```

## Runtime Start Command
```bash
python3 server/server.py --host 0.0.0.0 --port 8420
```
