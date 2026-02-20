# RivicQ Crosschain Hub - Architecture

## Overview

The RivicQ Crosschain Hub is a Solana-based blockchain protocol that enables cross-chain transactions with regulatory compliance. It supports both **Open Source (OSS)** and **Enterprise** deployment architectures.

---

## Open Source Architecture (OSS)

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Web Wallet, CLI, SDK)                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Solana Blockchain                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Crosschain Hub Program                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │ Bridge   │ │  Wallet  │ │     eIDAS          │ │  │
│  │  │ Module   │ │  Module  │ │    Compliance      │ │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Ethereum │  │ BSC/    │  │ Polygon │
    │ Network │  │Arbitrum │  │Network  │
    └─────────┘  └─────────┘  └─────────┘
```

### OSS Features

| Feature | Status | Description |
|---------|--------|-------------|
| Bridge Module | ✅ | Cross-chain token transfers |
| Wallet Module | ✅ | Basic wallet management |
| eIDAS Compliance | ✅ | Basic compliance checks |
| Multi-chain Support | ✅ | ETH, BSC, Polygon, Arbitrum |

### OSS Limitations

- Basic wallet functionality
- No multi-signature support
- No key rotation
- No advanced audit logging
- Limited rate limiting

---

## Enterprise Architecture

### Components

```
┌────────────────────────────────────────────────────────────────────┐
│                        Enterprise Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   Vault      │  │   Audit      │  │    Key Management     │ │
│  │  Integration │  │   Logging    │  │    (Rotation)         │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │    Rate      │  │  Hardware    │  │    Multi-Sig         │ │
│  │  Limiting    │  │   Wallets    │  │     Support          │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
┌─────────────────────────────────┴──────────────────────────────────┐
│                      Solana Blockchain                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Enterprise Crosschain Hub Program               │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐ │ │
│  │  │  Bridge    │ │  Wallet    │ │      eIDAS 2.0         │ │ │
│  │  │  Module    │ │  Module    │ │    Compliance         │ │ │
│  │  └────────────┘ └────────────┘ └────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────────┐│ │
│  │  │              Arcium Privacy Layer                       ││ │
│  │  │     (Encrypted Compute / Zero-Knowledge Proofs)       ││ │
│  │  └─────────────────────────────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
         ┌────────────┬───────────┼───────────┬────────────┐
         ▼            ▼           ▼           ▼            ▼
    ┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────┐
    │Ethereum │  │ Solana  │ │  BSC    │ │Polygon  │  │Arbitrum │
    └─────────┘  └─────────┘ └─────────┘ └─────────┘  └─────────┘
```

### Enterprise Features

| Feature | Status | Description |
|---------|--------|-------------|
| Vault Integration | ✅ | HashiCorp Vault for secrets |
| Audit Logging | ✅ | Immutable compliance logs |
| Key Rotation | ✅ | Automatic key rotation |
| Multi-Sig Support | ✅ | M-of-N signatures |
| Rate Limiting | ✅ | TPS controls |
| Hardware Wallets | ✅ | Ledger/Trezor support |
| Circuit Breaker | ✅ | Emergency pause |
| Social Recovery | ✅ | Guardian-based recovery |
| MEV Protection | ✅ | Flashbots integration |

---

## Deployment Architectures

### OSS Deployment (Docker)

```yaml
# docker-compose.yml (OSS)
services:
  crosschain-hub:
    image: rivicq/crosschain-hub:oss-v2.0.0
    ports:
      - "8080:8080"
    environment:
      - SOLANA_NETWORK=mainnet-beta
```

### Enterprise Deployment (Kubernetes)

```yaml
# values-enterprise.yaml
replicaCount: 5
image:
  repository: rivicq/crosschain-hub-enterprise
  tag: v2.0.0

enterprise:
  enabled: true
  vault:
    enabled: true
    address: https://vault.enterprise.com
  auditLogging:
    enabled: true
    backend: s3
  keyRotation:
    enabled: true
    interval: 90d
```

---

## Security Comparison

| Security Feature | OSS | Enterprise |
|-----------------|-----|-------------|
| TLS/SSL Encryption | ✅ | ✅ |
| Non-root Container | ✅ | ✅ |
| Network Policies | Basic | Advanced |
| Secrets Management | Env Vars | Vault |
| Audit Logs | Basic | Full |
| Compliance Reports | ❌ | ✅ |
| SLA Support | Community | 24/7 Enterprise |

---

## Performance

| Metric | OSS | Enterprise |
|--------|-----|-------------|
| TPS (Cross-chain) | ~100 | ~1000 |
| Max Anonymity Set | 1,000 | 100,000 |
| Latency | <5s | <1s |
| Uptime SLA | Best effort | 99.99% |

---

## Quick Start

### OSS

```bash
# Docker
docker run -d -p 8080:8080 rivicq/crosschain-hub:oss-v2.0.0

# Build from source
cargo build --release
```

### Enterprise

```bash
# Kubernetes with Helm
helm install crosschain-hub ./helm/crosschain-hub \
  -f values.enterprise.yaml

# Configure Vault
export VAULT_ADDR=https://vault.company.com
export VAULT_TOKEN=xxx
```

---

## License

| Version | License | Price |
|---------|---------|-------|
| OSS | MIT | Free |
| Enterprise | Proprietary | Contact sales |

**Contact:** enterprise@rivicq.com
