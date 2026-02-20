use crate::eidas::EidasLevel;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Wallet {
    pub owner: Pubkey,
    pub created_at: i64,
    pub is_compliance_verified: bool,
    pub eidas_level: EidasLevel,
    pub public_key: Vec<u8>,
    pub metadata: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct WalletData {
    pub public_key: Vec<u8>,
    pub metadata: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TransactionSignatureData {
    pub transaction_hash: Vec<u8>,
    pub amount: u64,
    pub recipient: Pubkey,
    pub source_chain: u64,
    pub destination_chain: u64,
    pub nonce: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct MultiSigWallet {
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub created_at: i64,
    pub eidas_required: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct WalletConfig {
    pub min_balance: u64,
    pub max_daily_transfer: u64,
    pub allowed_chains: Vec<u64>,
    pub require_eidas: bool,
    pub require_2fa: bool,
    pub enable_allowlist: bool,
    pub enable_blocklist: bool,
}

impl Default for WalletConfig {
    fn default() -> Self {
        Self {
            min_balance: 0,
            max_daily_transfer: u64::MAX,
            allowed_chains: vec![1, 10, 42161, 8453],
            require_eidas: false,
            require_2fa: false,
            enable_allowlist: false,
            enable_blocklist: false,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TransactionRecord {
    pub id: String,
    pub timestamp: i64,
    pub tx_hash: Vec<u8>,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub status: TransactionStatus,
    pub chain_id: u64,
    pub cross_chain: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    Cancelled,
}

pub fn validate_wallet_transfer(
    wallet: &Wallet,
    amount: u64,
    config: &WalletConfig,
) -> Result<bool, String> {
    if config.require_eidas && wallet.eidas_level == EidasLevel::None {
        return Err("eIDAS verification required for this transaction".to_string());
    }

    if wallet.eidas_level == EidasLevel::Basic && amount > 100_000_000 {
        return Err("Basic eIDAS level has transaction limits".to_string());
    }

    Ok(true)
}

pub fn derive_multi_chain_address(master_key: &Pubkey, chain_id: u64, index: u32) -> Pubkey {
    use solana_sdk::pubkey::Pubkey;

    let seed = format!("{}{}{}", chain_id, index, master_key);
    let (address, _) =
        Pubkey::find_program_address(&[seed.as_bytes()], &solana_sdk::system_program::id());
    address
}

pub fn verify_transaction_limits(
    daily_total: u64,
    amount: u64,
    config: &WalletConfig,
) -> Result<bool, String> {
    if daily_total + amount > config.max_daily_transfer {
        return Err("Daily transfer limit exceeded".to_string());
    }
    Ok(true)
}
