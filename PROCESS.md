```bash
cd ~/KANTPhone
sudo bash deploy/activate.sh
sudo reboot
```

```bash
http://<pi-ip>:8420
```

```bash
python3 server/server.py --host 0.0.0.0 --port 8420
```



```bash
hostname -I
```

```bash
ip addr
```

```bash
ping raspberrypi.local
```

```bash
nmap -sn 192.168.1.0/24
```

```bash
http://<pi-ip>:8420
```




```bash
chmod +x deploy/manage-docker.sh && bash -n deploy/manage-docker.sh
```


```bash
cd ~/KANTPhone
sudo bash deploy/manage-docker.sh up
sudo bash deploy/manage-docker.sh logs
sudo bash deploy/manage-docker.sh ps
sudo bash deploy/manage-docker.sh restart
sudo bash deploy/manage-docker.sh down
```

```bash
http://<pi-ip>:8420
```