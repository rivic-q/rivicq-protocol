import { describe, it, expect, beforeEach } from 'vitest';
import { CrossChainService, ChainId, MultiChainService } from '../src/chainservice';
import { ComplianceMonitor } from '../src/compliance';
import { RelayerService } from '../src/relayer';

describe('CrossChainService', () => {
  let service: CrossChainService;
  const privateKey = '0x' + '11'.repeat(32);

  beforeEach(() => {
    service = new CrossChainService(privateKey);
  });

  describe('Initialization', () => {
    it('should initialize with correct chain configs', () => {
      expect(service).toBeDefined();
    });

    it('should have correct chain IDs configured', () => {
      const config1 = (service as any).providers.get(ChainId.ETHEREUM_MAINNET);
      const config137 = (service as any).providers.get(ChainId.POLYGON_MAINNET);
      expect(config1).toBeDefined();
      expect(config137).toBeDefined();
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate transfer fee correctly', async () => {
      const amount = BigInt(1e18);
      const fee = await service.estimateTransferFee(
        amount,
        ChainId.ETHEREUM_MAINNET,
        ChainId.POLYGON_MAINNET,
        false
      );
      expect(fee).toBeGreaterThan(BigInt(0));
    });

    it('should estimate fast confirmation fee correctly', async () => {
      const amount = BigInt(1e18);
      const fastFee = await service.estimateTransferFee(
        amount,
        ChainId.ETHEREUM_MAINNET,
        ChainId.POLYGON_MAINNET,
        true
      );
      const normalFee = await service.estimateTransferFee(
        amount,
        ChainId.ETHEREUM_MAINNET,
        ChainId.POLYGON_MAINNET,
        false
      );
      expect(fastFee).toBeGreaterThan(normalFee);
    });
  });

  describe('Compliance Verification', () => {
    it('should return compliance info', async () => {
      const info = await service.verifyCompliance('0x1234', ChainId.ETHEREUM_MAINNET);
      expect(info).toBeDefined();
      expect(info.wallet).toBe('0x1234');
    });
  });
});

describe('ComplianceMonitor', () => {
  let monitor: ComplianceMonitor;
  const adminKey = '0x' + 'aa'.repeat(32);

  beforeEach(() => {
    const { Wallet, providers } = require('ethers');
    const wallet = new Wallet(adminKey);
    monitor = new ComplianceMonitor(wallet);
  });

  describe('Rules Management', () => {
    it('should have default compliance rules', () => {
      const rules = monitor.getRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should add custom rule', () => {
      const rule = {
        id: 'TEST_RULE',
        name: 'Test Rule',
        description: 'Test description',
        condition: {
          type: 'balance' as const,
          operator: 'gt' as const,
          value: BigInt(1e18),
        },
        action: {
          type: 'deny' as const,
          message: 'Test denied',
        },
        severity: 'high' as const,
      };
      
      monitor.addRule(rule);
      const rules = monitor.getRules();
      expect(rules.find(r => r.id === 'TEST_RULE')).toBeDefined();
    });

    it('should remove rule', () => {
      monitor.removeRule('HIGH_VALUE_UNVERIFIED');
      const rules = monitor.getRules();
      expect(rules.find(r => r.id === 'HIGH_VALUE_UNVERIFIED')).toBeUndefined();
    });
  });

  describe('Transfer Evaluation', () => {
    it('should evaluate high value transfer without verification', async () => {
      const wallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f';
      const amount = BigInt(2e18);
      
      const result = await monitor.evaluateTransfer(
        wallet,
        amount,
        ChainId.ETHEREUM_MAINNET
      );
      
      expect(result.allowed).toBe(false);
    });

    it('should evaluate small transfer as allowed', async () => {
      const wallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f';
      const amount = BigInt(1e15);
      
      const result = await monitor.evaluateTransfer(
        wallet,
        amount,
        ChainId.ETHEREUM_MAINNET
      );
      
      expect(result.allowed).toBe(true);
    });
  });

  describe('Alerts', () => {
    it('should get alerts by wallet', () => {
      const alerts = monitor.getAlerts('0x1234');
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should get audit logs by wallet', () => {
      const logs = monitor.getAuditLog('0x1234');
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});

describe('RelayerService', () => {
  let relayer: RelayerService;
  const privateKey = '0x' + '22'.repeat(32);

  beforeEach(() => {
    relayer = new RelayerService({
      privateKey,
      chains: [ChainId.ETHEREUM_MAINNET, ChainId.POLYGON_MAINNET],
      pollingInterval: 5000,
      confirmationBlocks: {
        [ChainId.ETHEREUM_MAINNET]: 12,
        [ChainId.POLYGON_MAINNET]: 100,
      },
    });
  });

  describe('Queue Management', () => {
    it('should have empty queue initially', () => {
      expect(relayer.getQueueLength()).toBe(0);
    });

    it('should track confirmation count', () => {
      expect(relayer.getConfirmationCount('0x1234')).toBe(0);
    });
  });
});
