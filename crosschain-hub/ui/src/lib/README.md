# RivicQ - Privacy Protocol for Web3

<p align="center">
  <img src="https://rivicq.com/logo.png" alt="RivicQ" width="200"/>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"/>
  </a>
  <a href="https://discord.gg/rivicq">
    <img src="https://img.shields.io/discord/1234567890" alt="Discord"/>
  </a>
  <a href="https://docs.rivicq.com">
    <img src="https://img.shields.io/badge/docs-available-blue.svg" alt="Documentation"/>
  </a>
</p>

---

## What is RivicQ?

**RivicQ** is a comprehensive privacy protocol for Web3 that enables confidential blockchain transactions using zero-knowledge proofs (ZK-SNARKs) while maintaining regulatory compliance.

Think of it as **Zcash meets Visa for the modern web** - enabling private transactions with enterprise-grade security features.

---

## Quick Demo

### 1. Install Dependencies

```bash
# Clone the repository
git clone https://github.com/RivicQ/rivicq.git
cd rivicq

# Install Node.js dependencies (for UI/SDK)
cd ui && npm install

# Install Rust dependencies (for core protocol)
cd .. && cargo build
```

### 2. Quick Start - Create a Privacy Wallet

```typescript
// ui/src/lib/rivicq-oss.ts
import { createRivicQWallet, RivicQWallet } from './rivicq-oss';

async function main() {
  // Create a new privacy wallet
  const wallet: RivicQWallet = createRivicQWallet();
  const address = await wallet.initialize();
  
  console.log('Your privacy address:', address);
  // Output: 0x1234... (a privacy-enhanced address)
}

main();
```

### 3. Create a Confidential Transfer

```typescript
import { createRivicQWallet, createRivicQConfidential } from './rivicq-oss';

async function confidentialTransfer() {
  const wallet = createRivicQWallet();
  await wallet.initialize();
  
  const confidential = createRivicQConfidential();
  
  // Create a confidential transfer (amounts & recipient hidden)
  const result = await confidential.createConfidentialTransfer(
    wallet.privateKey,  // sender's private key
    1000000n,           // amount (hidden)
    recipientAddress,   // recipient (hidden) 
    senderBalance        // sender balance (verified privately)
  );
  
  console.log('Transfer proof:', result.proof);
  console.log('Commitment:', result.commitment);
  console.log('Nullifier:', result.nullifier);
}
```

### 4. Generate a Privacy Proof

```typescript
import { RivicQCore, MiMC7, MerkleTree } from './rivicq-oss';

async function generateProof() {
  // Initialize the core protocol
  const rivicq = new RivicQCore(1); // Chain ID 1 (Ethereum)
  
  // Generate a zero-knowledge transfer proof
  const proof = await rivicq.generateTransferProof({
    amount: 1000000n,
    recipient: 0xABC...DEFn,
    salt: 123456789n,
    secret: secretKey,
    senderSecret: senderKey
  }, 5000000n);
  
  console.log('ZK Proof generated:', proof.pi_a.length > 0);
}
```

### 5. Enterprise - Multi-Sig Vault

```typescript
// For Enterprise features, contact enterprise@rivicq.com
import { createRivicQEnterprise } from './rivicq-enterprise';

async function multiSigExample() {
  const enterprise = await createRivicQEnterprise({
    licenseKey: 'YOUR-LICENSE-KEY',
    organizationId: 'YOUR-ORG-ID',
    tier: 'professional'
  });
  
  // Create a 2-of-3 multi-sig vault
  const vault = enterprise.multiSig;
  
  // Create transaction
  const txHash = await vault.createTransaction('tx1', data);
  
  // Collect signatures
  await vault.addSignature(txHash, signer1, signature1);
  await vault.addSignature(txHash, signer2, signature2);
  
  // Execute when threshold met
  await vault.executeTransaction(txHash, executor, executeFn);
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RIVICQ STACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     CLIENT LAYER                            │ │
│  │  Web App │ Mobile │ API SDK │ CLI │ Wallet Extension       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CORE PROTOCOL                            │ │
│  │                                                              │ │
│  │  ┌──────────────────┐    ┌──────────────────────┐        │ │
│  │  │   ZK Engine     │    │  Confidential Pool   │        │ │
│  │  │  • MiMC7       │    │  • Merkle Tree       │        │ │
│  │  │  • Poseidon    │    │  • Deposits/Withdraws │        │ │
│  │  │  • Groth16     │    │  • Nullifiers        │        │ │
│  │  └──────────────────┘    └──────────────────────┘        │ │
│  │                                                              │ │
│  │  ┌──────────────────┐    ┌──────────────────────┐        │ │
│  │  │   Identity      │    │  Encryption          │        │ │
│  │  │  • Anonymous    │    │  • ECIES             │        │ │
│  │  │    Auth         │    │  • Key Derivation    │        │ │
│  │  │  • Credentials  │    │  • State Encryption │        │ │
│  │  └──────────────────┘    └──────────────────────┘        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   BLOCKCHAIN LAYER                          │ │
│  │  Ethereum │ Solana │ BSC │ Polygon │ Arbitrum │ Avalanche │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Open Source (MIT License)

| Feature | Description |
|---------|-------------|
| **ZK Proofs** | Zero-knowledge proofs using MiMC7 & Poseidon hash functions |
| **Merkle Tree** | Binary tree for commitment verification (2^20 leaves) |
| **Confidential Transfers** | Hide sender, recipient, and amount |
| **Identity Proofs** | Anonymous authentication without revealing identity |
| **Range Proofs** | Prove value is within a range without revealing exact amount |
| **ECIES Encryption** | Industry-standard encrypted communications |

### Enterprise (Proprietary License)

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

## Supported Chains

| Chain | Status | Notes |
|-------|--------|-------|
| Ethereum | ✅ Mainnet | Full support |
| Solana | ✅ Mainnet | Full support |
| BSC | ✅ Mainnet | Full support |
| Polygon | ✅ Mainnet | Full support |
| Arbitrum | ✅ Mainnet | Full support |
| Optimism | ✅ Mainnet | Full support |
| Avalanche | ✅ Mainnet | Full support |
| Base | ✅ Mainnet | Full support |

---

## Security

### Audits

| Auditor | Status | Date |
|---------|--------|------|
| OpenZeppelin | Scheduled | Q2 2024 |
| Trail of Bits | Scheduled | Q2 2024 |
| Certik | Scheduled | Q3 2024 |

### Bug Bounty

We run a bug bounty program. Contact: security@rivicq.com

---

## Getting Started

### For Developers

```bash
# 1. Clone the repository
git clone https://github.com/RivicQ/rivicq.git

# 2. Install dependencies
cd ui && npm install

# 3. Run the demo
npm run demo

# 4. Build
npm run build

# 5. Read the docs
# See /docs directory
```

### For Enterprises

Contact us for a personalized demo and licensing:

- 📧 enterprise@rivicq.com
- 💬 [Discord](https://discord.gg/rivicq)
- 🌐 [rivicq.com](https://rivicq.com)

---

## License

### Open Source Components

The core privacy protocol and SDK are available under the **MIT License**:

```
MIT License

Copyright (c) 2024 RivicQ Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Enterprise Components

Enterprise features are proprietary and require a commercial license. Contact enterprise@rivicq.com for licensing terms.

---

## Project Structure

```
rivicq/
├── ui/                          # Frontend & SDK
│   ├── src/
│   │   └── lib/
│   │       ├── rivicq-oss.ts        # Open Source (MIT)
│   │       ├── rivicq-enterprise.ts # Enterprise (Proprietary)
│   │       ├── rivicq.ts            # Unified API
│   │       ├── ARCHITECTURE.md      # Full architecture docs
│   │       └── PITCH.md             # Pitch deck
│   └── package.json
│
├── src/                         # Rust/Solana Core
│   ├── lib.rs
│   ├── bridge.rs
│   ├── eidas.rs
│   ├── wallet.rs
│   └── arcium.rs
│
├── evm/                         # EVM Smart Contracts
│   ├── contracts/
│   └── test/
│
├── offchain/                    # Off-chain Services
│   └── src/
│
└── docs/                       # Documentation
    └── ...
```

---

## Contributing

### Open Source Contributions

We welcome contributions from the community! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

### Community

| Platform | Link |
|----------|------|
| Discord | [discord.gg/rivicq](https://discord.gg/rivicq) |
| Twitter | [@RivicQ](https://twitter.com/RivicQ) |
| GitHub | [github.com/RivicQ](https://github.com/RivicQ) |

---

## FAQ

**Q: How is privacy maintained?**
A: We use ZK-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) - the same technology used by Zcash and Ethereum's upcoming privacy upgrades.

**Q: Can regulators see transactions?**
A: Enterprise version includes compliance dashboards. Law enforcement can access with proper authorization through legal processes.

**Q: Which chains are supported?**
A: Ethereum, Solana, BSC, Polygon, Arbitrum, Optimism, Avalanche, and Base.

**Q: Is it audited?**
A: Audits are scheduled with OpenZeppelin, Trail of Bits, and Certik.

---

## Contact

| Type | Contact |
|------|---------|
| General | hello@rivicq.com |
| Enterprise | enterprise@rivicq.com |
| Security | security@rivicq.com |
| Support | support@rivicq.com |

---

<p align="center">
  <strong>RivicQ</strong> - Privacy for the Open Economy
</p>
