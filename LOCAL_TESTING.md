# Local Testing Guide

Quick guide to test the CCX faucet API locally with your walletd instance.

## Prerequisites

- ✅ `walletd` running on port 3333 (see [WALLETD_SETUP.md](./WALLETD_SETUP.md) for systemd setup)
- ✅ `conceald` running on port 16000 (optional, for daemon info)
- ✅ Docker & Docker Compose installed
- ✅ Node.js 18+ installed (if testing without Docker)

---

## Option 1: Docker Compose (Recommended)

### Step 1: Create `.env` file

```bash
cp env.example .env
```

Edit `.env` and adjust if needed (defaults should work with your local walletd).

### Step 2: Configure firewall (one-time setup)

Allow Docker containers to access your local walletd:

```bash
# Allow Docker network to access walletd port
sudo iptables -I INPUT -s 172.29.0.0/16 -p tcp --dport 3333 -j ACCEPT

# Save permanently
sudo apt install iptables-persistent -y
sudo netfilter-persistent save

# Verify
sudo iptables -L INPUT -n | grep 3333
```

**Note**: The fixed subnet (172.29.0.0/16) ensures this rule survives Docker restarts. You only need to run this once.

### Step 3: Start services

```bash
docker compose -f docker-compose.local.yml up -d --build
```

This starts:
- Redis on port 6379
- API on port 3066

### Step 4: Test the API

```bash
chmod +x test-local.sh
./test-local.sh
```

Or manually:

```bash
# Health check
curl http://localhost:3066/api/health

# Start session
curl "http://localhost:3066/api/start-game?address=ccx7Xd3NBbBDQfG6qNcCKRu1SjRGKXFNRX4F6mYQSB5ZPBkGaRBP7TegGAJYK3F5FPzPnT9TQ6kBGMPPTLUPn8wE6F9GpKYM7r"
```

### Step 5: Stop services

```bash
docker compose -f docker-compose.local.yml down
# to remove volumes:
docker-compose -f docker-compose.local.yml down -v
```

---

## Option 2: Without Docker

### Step 1: Start Redis

```bash
docker run -d --name redis-faucet -p 6379:6379 redis:7-alpine
```

Or install Redis locally and start it.

### Step 2: Create `.env` file

```bash
cp env.example .env
```

Edit `.env` and change:
```
REDIS_HOST=127.0.0.1
WALLET_HOST=http://127.0.0.1
DAEMON_HOST=http://127.0.0.1
```

### Step 3: Install dependencies

```bash
npm install
```

### Step 4: Start the API

```bash
npm start
```

### Step 5: Test

```bash
./test-local.sh
```

---

## Troubleshooting

### Docker containers cannot access host walletd

**Error**: "Wallet unavailable" or connection timeouts when using Docker Compose

**Cause**: You haven't configured the firewall rule in Step 2, or walletd isn't running.

**Solution**: 
1. Make sure you completed Step 2 (firewall configuration)
2. Verify walletd is running and bound to 0.0.0.0:
```bash
ps aux | grep walletd
sudo netstat -tlnp | grep 3333
```

3. Verify the iptables rule exists:
```bash
sudo iptables -L INPUT -n | grep "172.29.0.0"
```

4. If the rule is missing, add it:
```bash
sudo iptables -I INPUT -s 172.29.0.0/16 -p tcp --dport 3333 -j ACCEPT
sudo netfilter-persistent save
```

**Note**: With fixed subnet (172.29.0.0/16), the rule survives Docker restarts. You don't need to update it each time.

### Health check fails

**Error**: "Wallet or daemon unavailable"

**Solutions**:
- Check walletd is running: `curl http://127.0.0.1:3333/json_rpc -d '{"jsonrpc":"2.0","method":"getBalance","params":{},"id":1}'`
- Ensure walletd is bound to 0.0.0.0: `--bind-address 0.0.0.0` (not 127.0.0.1)
- Check FAUCET_ADDRESS is set in .env
- If using Docker: see "Docker containers cannot access host walletd" above

### Redis connection fails

**Error**: "Redis error: connect ECONNREFUSED"

**Solutions**:
- Check Redis is running: `docker ps | grep redis` or `redis-cli ping`
- If using Docker Compose: Redis should start automatically
- If running locally: ensure REDIS_HOST is set to `127.0.0.1`

### Session completed too quickly

**Error**: "Session completed too quickly"

**Solution**: Wait at least 5 seconds (MIN_SESSION_TIME_MS=5000) between start-game and claim

### Rate limit or cooldown

**Error**: "Request not available at this time"

**Solution**: 
- Wait 5 minutes (COOLDOWN_SECONDS=300 in local config)
- Or flush Redis: `docker exec redis-faucet redis-cli FLUSHALL` (testing only!)
- Or use a different address

---

## Configuration

Key `.env` variables for local testing:

```bash
# Lower amounts for testing
FAUCET_AMOUNT=10000        # 0.1 CCX

# Shorter times for testing
MIN_SESSION_TIME_MS=5000   # 5 seconds
COOLDOWN_SECONDS=300       # 5 minutes

# Lower score threshold
MIN_SCORE=100
```

---

## Next Steps

Once local testing works:
1. Review the main `README.md` for production deployment
2. Set up SSL certificates for HTTPS
3. Configure nginx for production
4. Adjust cooldowns and amounts for production use

