# Walletd Systemd Service Setup

Simple guide to run `walletd` as a systemd service.

---

## Setup

### 1. Copy and edit the service file

```bash
# Copy template
sudo cp ccx-walletd.service.template /etc/systemd/system/ccx-walletd.service

# Edit it
sudo nano /etc/systemd/system/ccx-walletd.service
```

### 2. Replace these placeholders:

- `YOUR_USERNAME` → Your Linux username
- `/path/to/walletd` → Full path to walletd binary
- `DAEMON_IP` → Your conceald IP (e.g., `127.0.0.1`, `192.168.1.109`, `node.conceal.network`)
- `DAEMON_PORT` → Daemon port (usually `16000`)
- `/path/to/wallet.file` → Full path to your wallet container file
- `WALLET_PASSWORD` → Your wallet password

### 3. Start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable ccx-walletd
sudo systemctl start ccx-walletd
sudo systemctl status ccx-walletd
```

---

## Example Configuration

```ini
[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/conceal-core/build/src

ExecStart=/home/pi/conceal-core/build/src/walletd \
    --daemon-address=192.168.1.109 \
    --daemon-port=16000 \
    --container-file=/home/pi/faucet.wallet \
    --container-password=MyWalletPass123 \
    --bind-address=0.0.0.0 \
    --bind-port=3333
```

---

## Test RPC Connection

```bash
curl -X POST http://127.0.0.1:3333/json_rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getStatus","params":{},"id":1}'
```

Expected: `{"jsonrpc":"2.0","result":{...},"id":1}`

---

## Common Commands

```bash
sudo systemctl start ccx-walletd      # Start
sudo systemctl stop ccx-walletd       # Stop
sudo systemctl restart ccx-walletd    # Restart
sudo systemctl status ccx-walletd     # Status
sudo journalctl -u ccx-walletd -f     # View logs
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u ccx-walletd -n 50

# Common issues:
# - Wrong paths
# - Wrong password
# - Daemon not accessible
# - Port already in use (check: sudo netstat -tlnp | grep 3333)
```

### Port already in use

```bash
sudo netstat -tlnp | grep 3333
pkill -9 walletd
sudo systemctl restart ccx-walletd
```

