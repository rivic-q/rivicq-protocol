import { ethers, Contract, Wallet, providers, BigNumber } from 'ethers';
import { ChainId, CHAIN_CONFIGS, TransferReceipt } from './chainservice';
import axios from 'axios';
import pino from 'pino';

const logger = pino({ level: 'info' });

export interface RelayerConfig {
  privateKey: string;
  chains: number[];
  pollingInterval: number;
  confirmationBlocks: Record<number, number>;
}

export interface CrossChainMessage {
  transferId: string;
  sender: string;
  recipient: string;
  amount: BigNumber;
  sourceChainId: number;
  destinationChainId: number;
  token: string;
  timestamp: number;
  nonce: number;
}

export interface RelayConfirmation {
  transferId: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  signatures: string[];
  signers: string[];
}

export class RelayerService {
  private providers: Map<number, providers.JsonRpcProvider> = [];
  private wallets: Map<number, Wallet> = [];
  private isRunning: boolean = false;
  private messageQueue: CrossChainMessage[] = [];
  private confirmations: Map<string, RelayConfirmation[]> = new Map();
  private requiredSignatures: number = 2;

  constructor(private config: RelayerConfig) {
    this.initialize();
  }

  private initialize() {
    for (const chainId of this.config.chains) {
      const config = CHAIN_CONFIGS[chainId];
      if (config) {
        const provider = new providers.JsonRpcProvider(config.rpcUrl);
        this.providers.set(chainId, provider);
        
        if (this.config.privateKey) {
          const wallet = new Wallet(this.config.privateKey, provider);
          this.wallets.set(chainId, wallet);
        }
      }
    }
  }

  async start() {
    this.isRunning = true;
    logger.info('Relayer service started');
    
    this.pollMessages();
    this.monitorConfirmations();
  }

  async stop() {
    this.isRunning = false;
    logger.info('Relayer service stopped');
  }

  private async pollMessages() {
    while (this.isRunning) {
      try {
        await this.fetchPendingMessages();
      } catch (error) {
        logger.error({ error }, 'Error fetching pending messages');
      }
      
      await this.processMessageQueue();
      
      await new Promise(resolve => 
        setTimeout(resolve, this.config.pollingInterval)
      );
    }
  }

  private async fetchPendingMessages() {
    for (const [chainId, provider] of this.providers) {
      try {
        const latestBlock = await provider.getBlockNumber();
        const config = CHAIN_CONFIGS[chainId];
        
        if (!config?.bridgeAddress) continue;

        logger.debug({ chainId, latestBlock }, 'Polling for messages');
      } catch (error) {
        logger.error({ error, chainId }, 'Error polling chain');
      }
    }
  }

  private async processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      try {
        await this.relayMessage(message);
      } catch (error) {
        logger.error({ error, message }, 'Error relaying message');
        this.messageQueue.push(message);
      }
    }
  }

  async relayMessage(message: CrossChainMessage): Promise<string> {
    const destinationWallet = this.wallets.get(message.destinationChainId);
    if (!destinationWallet) {
      throw new Error(`No wallet for destination chain ${message.destinationChainId}`);
    }

    const config = CHAIN_CONFIGS[message.destinationChainId];
    if (!config?.bridgeAddress) {
      throw new Error(`Bridge not configured for chain ${message.destinationChainId}`);
    }

    logger.info({ 
      transferId: message.transferId, 
      destinationChainId: message.destinationChainId 
    }, 'Relaying cross-chain message');

    const tx = await destinationWallet.sendTransaction({
      to: config.bridgeAddress,
      data: ethers.solidityPackedEncode(
        ['bytes32', 'address', 'uint256'],
        [message.transferId, message.recipient, message.amount]
      )
    });

    await tx.wait();

    logger.info({ 
      transferId: message.transferId, 
      txHash: tx.hash 
    }, 'Cross-chain message relayed');

    return tx.hash;
  }

  private async monitorConfirmations() {
    while (this.isRunning) {
      try {
        for (const [transferId, confs] of this.confirmations) {
          if (confs.length >= this.requiredSignatures) {
            await this.processConfirmedTransfer(transferId, confs);
          }
        }
      } catch (error) {
        logger.error({ error }, 'Error monitoring confirmations');
      }

      await new Promise(resolve => 
        setTimeout(resolve, this.config.pollingInterval * 2)
      );
    }
  }

  async addConfirmation(confirmation: RelayConfirmation) {
    const existing = this.confirmations.get(confirmation.transferId) || [];
    existing.push(confirmation);
    this.confirmations.set(confirmation.transferId, existing);

    logger.info({ 
      transferId: confirmation.transferId, 
      confirmationCount: existing.length,
      required: this.requiredSignatures 
    }, 'Confirmation added');
  }

  private async processConfirmedTransfer(
    transferId: string,
    confirmations: RelayConfirmation[]
  ) {
    const firstConf = confirmations[0];
    const message: CrossChainMessage = {
      transferId,
      sender: ethers.constants.AddressZero,
      recipient: ethers.constants.AddressZero,
      amount: BigNumber.from(0),
      sourceChainId: firstConf.blockNumber,
      destinationChainId: firstConf.blockNumber,
      token: ethers.constants.AddressZero,
      timestamp: firstConf.timestamp,
      nonce: 0,
    };

    await this.relayMessage(message);
    this.confirmations.delete(transferId);
  }

  async submitCrossChainMessage(message: CrossChainMessage): Promise<void> {
    this.messageQueue.push(message);
    logger.info({ transferId: message.transferId }, 'Message queued for relay');
  }

  getQueueLength(): number {
    return this.messageQueue.length;
  }

  getConfirmationCount(transferId: string): number {
    return this.confirmations.get(transferId)?.length || 0;
  }
}

export class MessageBus {
  private messageHashes: Map<string, CrossChainMessage> = new Map();

  async publishMessage(message: CrossChainMessage): Promise<string> {
    const hash = ethers.keccak256(
      ethers.solidityPackedEncode(
        [
          'bytes32',
          'address',
          'address',
          'uint256',
          'uint256',
          'uint256',
          'address',
          'uint256',
          'uint256'
        ],
        [
          message.transferId,
          message.sender,
          message.recipient,
          message.amount,
          message.sourceChainId,
          message.destinationChainId,
          message.token,
          message.timestamp,
          message.nonce,
        ]
      )
    );

    this.messageHashes.set(hash, message);
    return hash;
  }

  async getMessage(hash: string): Promise<CrossChainMessage | null> {
    return this.messageHashes.get(hash) || null;
  }

  async verifyMessage(hash: string, message: CrossChainMessage): Promise<boolean> {
    const stored = await this.getMessage(hash);
    if (!stored) return false;

    return stored.transferId === message.transferId &&
           stored.sender === message.sender &&
           stored.recipient === message.recipient &&
           stored.amount.eq(message.amount);
  }
}
