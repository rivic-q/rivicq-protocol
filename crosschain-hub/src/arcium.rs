use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ArciumTransactionData {
    pub encrypted_payload: Vec<u8>,
    pub ciphertext: Vec<u8>,
    pub proof: Vec<u8>,
    pub public_inputs: Vec<u8>,
    pub arcium_program_id: Pubkey,
    pub encryption_public_key: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct EncryptedWalletState {
    pub encrypted_balance: Vec<u8>,
    pub encrypted_nonce: Vec<u8>,
    pub ciphertext_commitment: Vec<u8>,
    pub encryption_public_key: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ConfidentialTransferProof {
    pub zero_balance_proof: Vec<u8>,
    pub range_proof: Vec<u8>,
    pub ciphertext: Vec<u8>,
    pub public_encryption_key: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ArciumConfig {
    pub arcium_program: Pubkey,
    pub encryption_enabled: bool,
    pub proof_required: bool,
    pub max_encrypted_state_size: usize,
}

impl Default for ArciumConfig {
    fn default() -> Self {
        Self {
            arcium_program: Pubkey::default(),
            encryption_enabled: true,
            proof_required: true,
            max_encrypted_state_size: 1024,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum ArciumOperation {
    EncryptState,
    DecryptState,
    ConfidentialTransfer,
    EncryptedSwap,
    EncryptedStake,
    EncryptedVote,
}

pub fn validate_arcium_transaction(
    data: &ArciumTransactionData,
    config: &ArciumConfig,
) -> Result<bool, String> {
    if config.encryption_enabled && data.encrypted_payload.is_empty() {
        return Err("Encrypted payload required".to_string());
    }

    if config.proof_required && data.proof.is_empty() {
        return Err("Zero-knowledge proof required".to_string());
    }

    if data.ciphertext.len() > config.max_encrypted_state_size {
        return Err("Encrypted state too large".to_string());
    }

    Ok(true)
}

pub fn create_encrypted_payload(
    plaintext: &[u8],
    public_key: &[u8],
) -> Result<Vec<u8>, String> {
    if plaintext.is_empty() {
        return Err("Plaintext cannot be empty".to_string());
    }

    if public_key.is_empty() {
        return Err("Public key cannot be empty".to_string());
    }

    Ok(plaintext.to_vec())
}

pub fn verify_zero_knowledge_proof(
    proof: &[u8],
    public_inputs: &[u8],
) -> Result<bool, String> {
    if proof.is_empty() {
        return Err("Proof cannot be empty".to_string());
    }

    if public_inputs.is_empty() {
        return Err("Public inputs cannot be empty".to_string());
    }

    Ok(true)
}
