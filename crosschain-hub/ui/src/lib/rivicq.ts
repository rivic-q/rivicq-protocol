/**
 * RivicQ - Privacy Protocol for Web3
 * 
 * A complete privacy suite for blockchain transactions
 * with ZK proofs, compliance, and institutional features.
 * 
 * @version 2.0.0
 * @license MIT (Open Source) / Proprietary (Enterprise)
 * 
 * Usage:
 * 
 * Open Source (MIT License):
 *   import { RivicQOS } from '@rivicq/oss';
 * 
 * Enterprise (Commercial License):
 *   import { RivicQEnterprise } from '@rivicq/enterprise';
 * 
 * Unified API:
 *   import { createRivicQ } from '@rivicq/core';
 * 
 * Documentation: https://docs.rivicq.com
 * Enterprise: enterprise@rivicq.com
 */

export { 
  RivicQCore, 
  RivicQWallet, 
  RivicQConfidential,
  MiMC7,
  Poseidon,
  MerkleTree,
  ECIES,
  Signature,
  createRivicQ,
  createRivicQWallet,
  createRivicQConfidential,
  RIVICQ_OPEN_SOURCE_FEATURES,
  RIVICQ_VERSION,
  RIVICQ_TIER,
  LICENSE
} from './rivicq-oss';

export {
  RivicQEnterprise,
  EnterpriseLicenseManager,
  createRivicQEnterprise,
  RIVICQ_ENTERPRISE_FEATURES,
  MultiSigVault,
  TimelockVault,
  RateLimiter,
  AccessControl,
  AuditLogger,
  KeyRotationManager,
  HardwareWalletManager,
  ShieldedPool,
  EmergencyBreakerController,
  BatchTransactionProcessor,
  SocialRecoveryManager,
  MEVProtection,
  CrossChainVerifier,
  ComplianceManager
} from './rivicq-enterprise';

export type {
  EnterpriseConfig,
  ZKProofInput,
  ZKProofOutput,
  IdentityProof,
  ComplianceProof,
  RangeProof,
  Commitment,
  MerkleProof
} from './rivicq-oss';

export type {
  MultiSigConfig,
  TimelockSchedule,
  RateLimitConfig,
  Role,
  Permission,
  AccessControlUser,
  AuditLogEntry,
  KeyRotationRecord,
  ShieldedNote,
  BatchTransaction,
  BatchItem,
  SocialRecoveryConfig,
  EmergencyBreaker,
  CrossChainProof,
  ComplianceReport
} from './rivicq-enterprise';

export interface RivicQConfig {
  tier: 'oss' | 'enterprise';
  chainId?: number;
  licenseKey?: string;
  organizationId?: string;
}

export function createRivicQ(config: RivicQConfig) {
  if (config.tier === 'enterprise') {
    if (!config.licenseKey) {
      throw new Error('Enterprise tier requires a license key');
    }
    return import('./rivicq-enterprise').then(m => 
      m.createRivicQEnterprise({
        licenseKey: config.licenseKey!,
        organizationId: config.organizationId || '',
        tier: 'professional',
        features: m.RIVICQ_ENTERPRISE_FEATURES,
        supportLevel: 'email'
      })
    );
  }
  
  return Promise.resolve({
    core: createRivicQCore(config.chainId || 1),
    wallet: createRivicQWallet(),
    confidential: createRivicQConfidential()
  });
}

export function createRivicQCore(chainId: number = 1) {
  const { RivicQCore } = require('./rivicq-oss');
  return new RivicQCore(chainId);
}

export const RIVICQ_PRODUCTS = {
  OSS: {
    name: 'RivicQ Open Source',
    tier: 'oss',
    license: 'MIT',
    features: [
      'ZK-Proofs (MiMC7, Poseidon)',
      'Merkle Tree Commitments',
      'Confidential Transfers',
      'Identity Proofs',
      'Range Proofs',
      'ECIES Encryption',
      'Basic Compliance',
      'Community Support'
    ]
  },
  STARTER: {
    name: 'RivicQ Starter',
    tier: 'enterprise',
    license: 'Commercial',
    features: [
      'Everything in OSS',
      'Multi-Sig Vaults',
      'Rate Limiting',
      'Access Control',
      'Audit Logging',
      'Email Support'
    ]
  },
  PROFESSIONAL: {
    name: 'RivicQ Professional',
    tier: 'enterprise',
    license: 'Commercial',
    features: [
      'Everything in Starter',
      'Timelock Vaults',
      'Key Rotation',
      'Hardware Wallet',
      'Shielded Pool',
      'MEV Protection',
      'Batch Transactions',
      'Priority Support'
    ]
  },
  INSTITUTIONAL: {
    name: 'RivicQ Institutional',
    tier: 'enterprise',
    license: 'Commercial',
    features: [
      'Everything in Professional',
      'Social Recovery',
      'Circuit Breaker',
      'Cross-Chain',
      'Compliance Manager',
      'White-Label',
      'Dedicated Support',
      'Custom Integrations',
      'SLA Guarantee'
    ]
  }
};

export const RIVICQ_VERSION = '2.0.0';
export const RIVICQ_BUILD = '2024.01.15';

export default {
  createRivicQ,
  createRivicQCore,
  createRivicQWallet,
  createRivicQConfidential,
  RIVICQ_PRODUCTS,
  RIVICQ_VERSION,
  RIVICQ_BUILD
};
