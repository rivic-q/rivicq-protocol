use crate::eidas::EidasLevel;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct CrossChainTransferData {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub destination_chain: u64,
    pub source_chain: u64,
    pub token_address: Option<Pubkey>,
    pub fee: u64,
    pub nonce: u64,
    pub timestamp: i64,
    pub status: TransferStatus,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum TransferStatus {
    Pending,
    Initiated,
    Confirmed,
    Completed,
    Failed,
    Cancelled,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct BridgeConfig {
    pub min_confirmation_blocks: u64,
    pub max_confirmation_blocks: u64,
    pub relayer_fee: u64,
    pub protocol_fee: u64,
    pub emergency_breaker: bool,
    pub supported_tokens: Vec<TokenConfig>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TokenConfig {
    pub mint: Pubkey,
    pub symbol: String,
    pub decimals: u8,
    pub max_transfer: u64,
    pub min_transfer: u64,
    pub enabled: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct CrossChainMessage {
    pub id: String,
    pub source_chain: u64,
    pub destination_chain: u64,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub message_type: MessageType,
    pub payload: Vec<u8>,
    pub nonce: u64,
    pub timestamp: i64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum MessageType {
    TokenTransfer,
    TokenReceive,
    ContractCall,
    ContractCallWithToken,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct RelayConfirmation {
    pub relayer: Pubkey,
    pub tx_hash: Vec<u8>,
    pub block_number: u64,
    pub timestamp: i64,
    pub signatures: Vec<Vec<u8>>,
    pub signers: Vec<Pubkey>,
}

pub fn calculate_cross_chain_fee(amount: u64, protocol_fee_bps: u16, relayer_fee: u64) -> u64 {
    let protocol_fee = (amount as u128 * protocol_fee_bps as u128 / 10000) as u64;
    protocol_fee + relayer_fee
}

pub fn validate_cross_chain_transfer(
    amount: u64,
    _destination_chain: u64,
    config: &BridgeConfig,
    eidas_level: &EidasLevel,
) -> Result<bool, String> {
    if !config.supported_tokens.iter().any(|t| t.enabled) {
        return Err("No enabled tokens available for transfer".to_string());
    }

    if *eidas_level == EidasLevel::None && amount > 1_000_000_000 {
        return Err("Large transfers require eIDAS compliance".to_string());
    }

    Ok(true)
}

pub fn encode_bridge_message(message: &CrossChainMessage) -> Vec<u8> {
    message.try_to_vec().unwrap_or_default()
}

pub fn decode_bridge_message(data: &[u8]) -> Result<CrossChainMessage, String> {
    CrossChainMessage::try_from_slice(data).map_err(|e| format!("Failed to decode message: {}", e))
}

pub fn verify_relay_confirmation(
    confirmations: &[RelayConfirmation],
    required_signatures: u8,
) -> Result<bool, String> {
    if confirmations.len() < required_signatures as usize {
        return Err("Insufficient relay confirmations".to_string());
    }
    Ok(true)
}
