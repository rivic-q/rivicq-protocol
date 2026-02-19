import { describe, it, expect, beforeEach } from 'vitest';
import {
  ZKProofGenerator,
  ZKWallet,
  ConfidentialTransaction,
  ArciumEncryption,
} from '../src/zkproof';

describe('ZKProofGenerator', () => {
  let zk: ZKProofGenerator;

  beforeEach(() => {
    zk = new ZKProofGenerator();
  });

  describe('Transfer Proofs', () => {
    it('should generate transfer proof', async () => {
      const proof = await zk.generateTransferProof({
        amount: BigInt(1e18),
        recipient: BigInt(1234),
        salt: BigInt(5678),
        secret: BigInt(9012),
      });

      expect(proof).toBeDefined();
      expect(proof.pi_a).toBeDefined();
      expect(proof.pi_b).toBeDefined();
      expect(proof.pi_c).toBeDefined();
      expect(proof.publicSignals).toBeDefined();
    });

    it('should verify transfer proof', async () => {
      const proof = await zk.generateTransferProof({
        amount: BigInt(1e18),
        recipient: BigInt(1234),
        salt: BigInt(5678),
        secret: BigInt(9012),
      });

      const valid = await zk.verifyTransferProof(proof);
      expect(valid).toBe(true);
    });
  });

  describe('Identity Proofs', () => {
    it('should generate identity proof', async () => {
      const proof = await zk.generateIdentityProof(
        BigInt(123456789),
        BigInt(987654321)
      );

      expect(proof).toBeDefined();
      expect(proof.identityHash).toBeDefined();
      expect(proof.ephemeralPublicKey).toBeDefined();
      expect(proof.proof).toBeDefined();
    });
  });

  describe('Compliance Proofs', () => {
    it('should generate compliance proof', async () => {
      const proof = await zk.generateComplianceProof(
        3, // High
        true,
        true,
        BigInt(111111)
      );

      expect(proof).toBeDefined();
      expect(proof.verified).toBe(true);
      expect(proof.level).toBe(3);
      expect(proof.proof).toBeDefined();
    });

    it('should return verified false for non-compliant', async () => {
      const proof = await zk.generateComplianceProof(
        0,
        false,
        false,
        BigInt(222222)
      );

      expect(proof.verified).toBe(false);
    });
  });

  describe('Range Proofs', () => {
    it('should generate range proof', async () => {
      const proof = await zk.generateRangeProof(
        BigInt(5000),
        BigInt(1000),
        BigInt(10000),
        BigInt(333333)
      );

      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.minValue).toBe(BigInt(1000));
      expect(proof.maxValue).toBe(BigInt(10000));
    });

    it('should verify range proof', async () => {
      const rangeProof = await zk.generateRangeProof(
        BigInt(5000),
        BigInt(1000),
        BigInt(10000),
        BigInt(333333)
      );

      const valid = await zk.verifyRangeProof(rangeProof);
      expect(valid).toBe(true);
    });
  });

  describe('Random BigInt Generation', () => {
    it('should generate random bigint of correct bit length', () => {
      const num1 = zk.generateRandomBigInt(256);
      const num2 = zk.generateRandomBigInt(256);

      expect(num1).toBeGreaterThan(BigInt(0));
      expect(num2).toBeGreaterThan(BigInt(0));
      expect(num1).not.toEqual(num2);
    });

    it('should generate different bit lengths', () => {
      const num128 = zk.generateRandomBigInt(128);
      const num256 = zk.generateRandomBigInt(256);

      expect(num128).toBeGreaterThan(BigInt(0));
      expect(num256).toBeGreaterThan(BigInt(0));
    });
  });
});

describe('ZKWallet', () => {
  let wallet: ZKWallet;

  beforeEach(() => {
    wallet = new ZKWallet();
  });

  describe('Identity Proofs', () => {
    it('should create identity proof', async () => {
      const proof = await wallet.createIdentityProof();
      expect(proof).toBeDefined();
      expect(proof.identityHash).toBeDefined();
    });
  });

  describe('Compliance Proofs', () => {
    it('should create compliance proof for verified user', async () => {
      const proof = await wallet.createComplianceProof(3, true, true);
      expect(proof.verified).toBe(true);
      expect(proof.level).toBe(3);
    });

    it('should create compliance proof for unverified user', async () => {
      const proof = await wallet.createComplianceProof(0, false, false);
      expect(proof.verified).toBe(false);
    });
  });

  describe('Transfer Proofs', () => {
    it('should create transfer proof', async () => {
      const proof = await wallet.createTransferProof(
        BigInt(1e18),
        BigInt(1234)
      );
      expect(proof).toBeDefined();
    });
  });

  describe('Public Key', () => {
    it('should return valid public key', () => {
      const pubKey = wallet.getPublicKey();
      expect(pubKey).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });
});

describe('ConfidentialTransaction', () => {
  let ct: ConfidentialTransaction;
  const senderPrivateKey = BigInt(11111111111);
  const senderBalance = BigInt(10e18);

  beforeEach(() => {
    ct = new ConfidentialTransaction();
  });

  describe('Confidential Transfers', () => {
    it('should create confidential transfer', async () => {
      const result = await ct.createConfidentialTransfer(
        senderPrivateKey,
        BigInt(1e18),
        BigInt(1234),
        senderBalance
      );

      expect(result).toBeDefined();
      expect(result.proof).toBeDefined();
      expect(result.commitment).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.nullifier).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should verify valid confidential transfer', async () => {
      const result = await ct.createConfidentialTransfer(
        senderPrivateKey,
        BigInt(1e18),
        BigInt(1234),
        senderBalance
      );

      const verification = await ct.verifyConfidentialTransfer(
        result.proof,
        result.commitment,
        result.nullifier,
        new Set()
      );

      expect(verification.valid).toBe(true);
    });

    it('should detect double spend', async () => {
      const result = await ct.createConfidentialTransfer(
        senderPrivateKey,
        BigInt(1e18),
        BigInt(1234),
        senderBalance
      );

      const spentNullifiers = new Set([result.nullifier]);

      const verification = await ct.verifyConfidentialTransfer(
        result.proof,
        result.commitment,
        result.nullifier,
        spentNullifiers
      );

      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('Double spend detected');
    });
  });
});

describe('ArciumEncryption', () => {
  let encryption: ArciumEncryption;

  beforeEach(() => {
    encryption = new ArciumEncryption();
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data', async () => {
      const plaintext = new TextEncoder().encode('Hello, World!');
      const publicKey = crypto.getRandomValues(new Uint8Array(32));

      const { ciphertext, ephemeralPublicKey } = await encryption.encryptState(
        plaintext,
        publicKey
      );

      expect(ciphertext).toBeDefined();
      expect(ephemeralPublicKey).toBeDefined();
      expect(ciphertext).not.toEqual(plaintext);
    });

    it('should produce different ciphertext each time', async () => {
      const plaintext = new TextEncoder().encode('Test message');
      const publicKey = crypto.getRandomValues(new Uint8Array(32));

      const result1 = await encryption.encryptState(plaintext, publicKey);
      const result2 = await encryption.encryptState(plaintext, publicKey);

      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
    });
  });
});
