# RivicQ - Privacy Protocol for Web3

<p align="center">
  <img src="https://rivicq.com/logo.png" alt="RivicQ" width="200"/>
</p>

<p align="center">
  <a href="https://github.com/rivic-q/rivicq-protocol/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License"/>
  </a>
  <img src="https://img.shields.io/badge/Version-2.0.0-blue.svg" alt="Version"/>
  <img src="https://img.shields.io/badge/ZKProofs-Groth16-orange.svg" alt="ZK Proofs"/>
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status"/>
  <a href="https://discord.gg/rivicq">
    <img src="https://img.shields.io/discord/1234567890" alt="Discord"/>
  </a>
  <img src="https://img.shields.io/badge/Legal-GDPR--Compliant-blueviolet.svg" alt="GDPR"/>
  <img src="https://img.shields.io/badge/Legal-BaFin--Ready-red.svg" alt="BaFin"/>
</p>

---

## What is RivicQ?

**RivicQ** is a comprehensive privacy protocol for Web3 that enables confidential blockchain transactions using zero-knowledge proofs (ZK-SNARKs) while maintaining regulatory compliance. Built with German engineering precision and EU regulatory compliance at its core.

---

## Open Source Features (MIT License)

| Feature | Description |
|---------|-------------|
| **ZK Proofs** | Zero-knowledge proofs using MiMC7 & Poseidon hash functions |
| **Merkle Tree** | Binary tree for commitment verification (2^20 leaves) |
| **Confidential Transfers** | Hide sender, recipient, and amount |
| **Identity Proofs** | Anonymous authentication without revealing identity |
| **Range Proofs** | Prove value is within a range without revealing exact amount |
| **ECIES Encryption** | Industry-standard encrypted communications |

## Enterprise Features (Proprietary License)

| Feature | Description |
|---------|-------------|
| **Multi-Sig Vaults** | M-of-N signature requirements for team funds |
| **Timelock Vaults** | Scheduled releases with configurable delays |
| **Rate Limiting** | TPS and volume controls per user/address |
| **Access Control** | Role-based permissions (RBAC) |
| **Audit Logging** | Immutable logs for compliance & forensics |
| **Key Rotation** | Automatic key rotation with guardian approval |
| **Hardware Wallet** | Ledger & Trezor integration |
| **Shielded Pool** | Enhanced privacy with larger anonymity set |
| **Circuit Breaker** | Emergency pause for critical operations |
| **Social Recovery** | Guardian-based account recovery |
| **MEV Protection** | Flashbots integration for front-run protection |
| **Cross-Chain** | Multi-chain proof verification |

---

## Quick Demo

```typescript
import { createRivicQWallet, createRivicQConfidential } from './rivicq-oss';

// Create a privacy wallet
const wallet = createRivicQWallet();
await wallet.initialize();

// Create confidential transfer
const confidential = createRivicQConfidential();
const result = await confidential.createConfidentialTransfer(
  wallet.privateKey,
  1000000n,
  recipientAddress,
  senderBalance
);
```

---

## Supported Chains

| Chain | Status |
|-------|--------|
| Ethereum | ✅ |
| Solana | ✅ |
| BSC | ✅ |
| Polygon | ✅ |
| Arbitrum | ✅ |
| Optimism | ✅ |
| Avalanche | ✅ |

---

## Getting Started

```bash
# Clone
git clone https://github.com/rivic-q/rivicq-protocol.git

# Navigate to project
cd rivicq-protocol

# Install dependencies
cd ui && npm install

# Build
npm run build
```

---

## Documentation

- [Architecture](ui/src/lib/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Security](docs/SECURITY.md)

---

## License

| Component | License |
|-----------|---------|
| Open Source | [MIT](LICENSE) |
| Enterprise | Proprietary |

**Contact:** enterprise@rivicq.com

---

# Legal Notices

## Copyright Notice

```
Copyright (c) 2024-2026 RivicQ Inc.
All Rights Reserved.

This software and all associated documentation are proprietary 
and confidential. Unauthorized copying, distribution, or use of 
this material, via any medium, is strictly prohibited.

RivicQ® is a registered trademark of RivicQ Inc.
```

## German Law Compliance (Deutsches Recht)

This software complies with applicable German laws including:

- **BGB (Bürgerliches Gesetzbuch)**: Civil code requirements for software licensing
- **HGB (Handelsgesetzbuch)**: Commercial code for business transactions  
- **GDPR (DSGVO)**: General Data Protection Regulation compliance
- **BaFin Requirements**: German Federal Financial Supervisory Authority standards
- **GoBD**: Principles for proper accounting and record-keeping

### Datenschutz (Privacy)

RivicQ is designed with privacy-by-design principles compliant with:
- EU GDPR (Regulation (EU) 2016/679)
- German Federal Data Protection Act (BDSG)
- EU ePrivacy Directive

### Verbraucherschutz (Consumer Protection)

All open source components are provided "AS IS" without warranties per German product liability laws (ProdHaftG).

## EU Law Compliance

This software complies with:

- **EU General Data Protection Regulation (GDPR)**
- **EU Digital Services Act (DSA)**
- **EU Digital Markets Act (DMA)**
- **EU MiCA Regulation** (Markets in Crypto-Assets)
- **EU AMLD6** (Anti-Money Laundering Directive)

### Zero-Knowledge Privacy

Our ZK-based privacy technology ensures:
- Transaction confidentiality without compromising network transparency
- Selective disclosure for regulatory compliance
- Cryptographic proof of funds without revealing balances

## International Laws

- **United States**: CCPA, FinCEN regulations
- **United Kingdom**: FCA regulations, UK GDPR
- **Singapore**: MAS regulations
- **Japan**: PSA, JIS Q 15001

## Trademarks

**RivicQ®** and the RivicQ logo are registered trademarks of **RivicQ Inc.**

All other trademarks, service marks, and trade names are the property of their respective owners.

## Patents

RivicQ Inc. owns and maintains intellectual property rights, including patents and patent applications, for the technologies disclosed in this repository.

**Patent Licensing:** ip@rivicq.com

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Contact

| Type | Contact |
|------|---------|
| General | hello@rivicq.com |
| Enterprise | enterprise@rivicq.com |
| Security | security@rivicq.com |
| Legal | legal@rivicq.com |
| Patents | ip@rivicq.com |

---

<p align="center">
  <strong>© 2024-2026 RivicQ Inc. All rights reserved.</strong><br/>
  Privacy for the Open Economy<br/>
  Made with ❤️ in Germany 🇩🇪
</p>

# Trigger CI
