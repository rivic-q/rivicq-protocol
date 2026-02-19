import { ethers, Contract, Wallet, providers, BigNumber } from 'ethers';
import { ChainId, CHAIN_CONFIGS, ComplianceInfo } from './chainservice';
import pino from 'pino';

const logger = pino({ level: 'info' });

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  condition: ComplianceCondition;
  action: ComplianceAction;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceCondition {
  type: 'balance' | 'transaction' | 'jurisdiction' | 'kyc' | 'aml' | 'custom';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
}

export interface ComplianceAction {
  type: 'allow' | 'deny' | 'flag' | 'review' | 'freeze';
  message?: string;
  notify?: string[];
}

export interface ComplianceAlert {
  id: string;
  wallet: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  details: any;
  timestamp: number;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  wallet: string;
  details: any;
  complianceStatus: string;
  signature?: string;
}

export class ComplianceMonitor {
  private rules: Map<string, ComplianceRule> = new Map();
  private alerts: Map<string, ComplianceAlert> = new Map();
  private auditLog: AuditEntry[] = [];
  private providers: Map<number, providers.JsonRpcProvider> = new Map();
  private eidasContracts: Map<number, Contract> = new Map();
  private monitoredWallets: Set<string> = new Set();
  private isRunning: boolean = false;

  constructor(private adminWallet: Wallet) {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.addRule({
      id: 'HIGH_VALUE_UNVERIFIED',
      name: 'High Value Transfer Without Verification',
      description: 'Block transfers over 1M without eIDAS compliance',
      condition: {
        type: 'transaction',
        operator: 'gt',
        value: BigNumber.from(1_000_000).mul(BigNumber.from(10).pow(18)),
      },
      action: {
        type: 'deny',
        message: 'High value transfers require eIDAS compliance',
      },
      severity: 'high',
    });

    this.addRule({
      id: 'RESTRICTED_JURISDICTION',
      name: 'Restricted Jurisdiction',
      description: 'Block transactions from restricted jurisdictions',
      condition: {
        type: 'jurisdiction',
        operator: 'in',
        value: ['KP', 'IR', 'SY', 'CU', 'BY'],
      },
      action: {
        type: 'deny',
        message: 'Transactions from restricted jurisdictions are not allowed',
      },
      severity: 'critical',
    });

    this.addRule({
      id: 'KYC_REQUIRED',
      name: 'KYC Required',
      description: 'Require KYC verification for all transactions',
      condition: {
        type: 'kyc',
        operator: 'eq',
        value: false,
      },
      action: {
        type: 'deny',
        message: 'KYC verification required',
      },
      severity: 'medium',
    });

    this.addRule({
      id: 'AML_SCREENING',
      name: 'AML Screening',
      description: 'Require AML screening for high-risk wallets',
      condition: {
        type: 'aml',
        operator: 'eq',
        value: false,
      },
      action: {
        type: 'review',
        message: 'AML screening required before processing',
      },
      severity: 'high',
    });
  }

  async initializeChains(chainIds: number[]) {
    for (const chainId of chainIds) {
      const config = CHAIN_CONFIGS[chainId];
      if (config?.eidasAddress) {
        const provider = new providers.JsonRpcProvider(config.rpcUrl);
        this.providers.set(chainId, provider);

        const abi = [
          'function complianceRecords(address) view returns (tuple(address wallet, uint8 eidasLevel, bool kycVerified, bool amlScreened, bool restricted, uint256 verificationDate, uint256 expiryDate, string jurisdiction))',
          'function checkTransferAllowed(address, uint256) view returns (bool, string)',
        ];

        const contract = new Contract(config.eidasAddress, abi, provider);
        this.eidasContracts.set(chainId, contract);
      }
    }
  }

  addRule(rule: ComplianceRule) {
    this.rules.set(rule.id, rule);
    logger.info({ ruleId: rule.id }, 'Compliance rule added');
  }

  removeRule(ruleId: string) {
    this.rules.delete(ruleId);
    logger.info({ ruleId }, 'Compliance rule removed');
  }

  async start() {
    this.isRunning = true;
    logger.info('Compliance monitor started');
  }

  async stop() {
    this.isRunning = false;
    logger.info('Compliance monitor stopped');
  }

  async evaluateTransfer(
    wallet: string,
    amount: BigNumber,
    chainId: number
  ): Promise<{ allowed: boolean; reason?: string; alerts: ComplianceAlert[] }> {
    const alerts: ComplianceAlert[] = [];
    let allowed = true;
    let reason = 'All compliance checks passed';

    const complianceInfo = await this.getComplianceInfo(wallet, chainId);

    for (const [_, rule] of this.rules) {
      const result = await this.evaluateRule(rule, wallet, amount, complianceInfo);
      
      if (!result.passed) {
        allowed = allowed && result.action.type !== 'deny';
        
        if (!result.passed) {
          const alert = this.createAlert(wallet, rule, result.details);
          alerts.push(alert);

          if (result.action.type === 'deny') {
            reason = result.action.message || `Rule ${rule.id} failed`;
            break;
          }
        }
      }
    }

    this.createAuditEntry('TRANSFER_EVALUATION', wallet, {
      amount: amount.toString(),
      chainId,
      allowed,
      reason,
      alertsCount: alerts.length,
    });

    return { allowed, reason, alerts };
  }

  private async evaluateRule(
    rule: ComplianceRule,
    wallet: string,
    amount: BigNumber,
    complianceInfo: ComplianceInfo
  ): Promise<{ passed: boolean; action: ComplianceAction; details: any }> {
    const { condition, action, severity } = rule;

    let passed = true;
    let details = {};

    switch (condition.type) {
      case 'transaction':
        switch (condition.operator) {
          case 'gt':
            passed = amount.gt(BigNumber.from(condition.value));
            break;
          case 'lt':
            passed = amount.lt(BigNumber.from(condition.value));
            break;
          case 'gte':
            passed = amount.gte(BigNumber.from(condition.value));
            break;
          case 'lte':
            passed = amount.lte(BigNumber.from(condition.value));
            break;
        }
        details = { amount: amount.toString(), threshold: condition.value };
        break;

      case 'kyc':
        passed = complianceInfo.kycVerified === condition.value;
        details = { kycVerified: complianceInfo.kycVerified };
        break;

      case 'aml':
        passed = complianceInfo.amlScreened === condition.value;
        details = { amlScreened: complianceInfo.amlScreened };
        break;

      case 'jurisdiction':
        passed = condition.value.includes(complianceInfo.jurisdiction);
        details = { jurisdiction: complianceInfo.jurisdiction };
        break;

      case 'balance':
        break;
    }

    return { passed, action, details };
  }

  private createAlert(wallet: string, rule: ComplianceRule, details: any): ComplianceAlert {
    const alert: ComplianceAlert = {
      id: ethers.keccak256(ethers.toUtf8Bytes(`${wallet}-${Date.now()}`)),
      wallet,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      details,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending',
    };

    this.alerts.set(alert.id, alert);
    logger.warn({ alert }, 'Compliance alert created');

    return alert;
  }

  private createAuditEntry(action: string, wallet: string, details: any) {
    const entry: AuditEntry = {
      id: ethers.keccak256(ethers.toUtf8Bytes(`${action}-${wallet}-${Date.now()}`)),
      timestamp: Math.floor(Date.now() / 1000),
      action,
      wallet,
      details,
      complianceStatus: 'COMPLIANT',
    };

    this.auditLog.push(entry);
    logger.debug({ entry }, 'Audit log entry created');
  }

  async getComplianceInfo(wallet: string, chainId: number): Promise<ComplianceInfo> {
    const contract = this.eidasContracts.get(chainId);
    
    if (contract) {
      try {
        const record = await contract.complianceRecords(wallet);
        return {
          wallet: record.wallet,
          eidasLevel: record.eidasLevel,
          kycVerified: record.kycVerified,
          amlScreened: record.amlScreened,
          jurisdiction: record.jurisdiction,
          verificationDate: record.verificationDate.toNumber(),
          expiryDate: record.expiryDate.toNumber(),
        };
      } catch (error) {
        logger.error({ error, wallet, chainId }, 'Error fetching compliance info');
      }
    }

    return {
      wallet,
      eidasLevel: 0,
      kycVerified: false,
      amlScreened: false,
      jurisdiction: 'UNKNOWN',
      verificationDate: 0,
      expiryDate: 0,
    };
  }

  async updateComplianceRecord(
    wallet: string,
    eidasLevel: number,
    kycVerified: boolean,
    amlScreened: boolean,
    jurisdiction: string,
    chainId: number
  ): Promise<void> {
    const contract = this.eidasContracts.get(chainId);
    if (!contract) {
      throw new Error(`No eIDAS contract for chain ${chainId}`);
    }

    const tx = await contract.updateComplianceRecord(
      wallet,
      eidasLevel,
      kycVerified,
      amlScreened,
      jurisdiction
    );

    await tx.wait();
    this.createAuditEntry('COMPLIANCE_UPDATE', wallet, {
      eidasLevel,
      kycVerified,
      amlScreened,
      jurisdiction,
      chainId,
    });

    logger.info({ wallet, chainId }, 'Compliance record updated');
  }

  getAlerts(wallet?: string, status?: string): ComplianceAlert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (wallet) {
      alerts = alerts.filter(a => a.wallet === wallet);
    }
    
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }
    
    return alerts;
  }

  getAuditLog(wallet?: string): AuditEntry[] {
    if (wallet) {
      return this.auditLog.filter(e => e.wallet === wallet);
    }
    return this.auditLog;
  }

  resolveAlert(alertId: string, status: 'resolved' | 'escalated' | 'investigating') {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = status;
      logger.info({ alertId, status }, 'Alert status updated');
    }
  }

  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }
}
