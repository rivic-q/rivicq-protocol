use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;
use std::collections::HashMap;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum EidasLevel {
    None,
    Basic,
    Substantial,
    High,
}

impl Default for EidasLevel {
    fn default() -> Self {
        Self::None
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct QualifiedCertificate {
    pub subject: String,
    pub issuer: String,
    pub serial_number: Vec<u8>,
    pub not_before: i64,
    pub not_after: i64,
    pub public_key_hash: Vec<u8>,
    pub certificate_type: CertificateType,
    pub country: String,
    pub qscd: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, PartialEq)]
pub enum CertificateType {
    QES,
    QESe,
    WebAuth,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct QualifiedSignature {
    pub signature: Vec<u8>,
    pub certificate: QualifiedCertificate,
    pub signed_data: Vec<u8>,
    pub timestamp: i64,
    pub signature_algorithm: String,
    pub signer_role: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct QualifiedTimestamp {
    pub ts_token: Vec<u8>,
    pub tsa_certificate: QualifiedCertificate,
    pub time: i64,
    pub hash_algorithm: String,
    pub hash_value: Vec<u8>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ComplianceData {
    pub verified: bool,
    pub eidas_level: EidasLevel,
    pub kyc_verified: bool,
    pub aml_screened: bool,
    pub restricted: bool,
    pub verification_date: i64,
    pub expiry_date: i64,
    pub jurisdiction: String,
    pub metadata: HashMap<String, String>,
}

impl Default for ComplianceData {
    fn default() -> Self {
        Self {
            verified: false,
            eidas_level: EidasLevel::None,
            kyc_verified: false,
            aml_screened: false,
            restricted: false,
            verification_date: 0,
            expiry_date: 0,
            jurisdiction: String::new(),
            metadata: HashMap::new(),
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct QualifiedSignatureData {
    pub data_to_sign: Vec<u8>,
    pub certificate: Vec<u8>,
    pub signature: Vec<u8>,
    pub timestamp: Option<i64>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct TimestampData {
    pub data_to_timestamp: Vec<u8>,
    pub hash_algorithm: String,
    pub require_qts: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct AuditLog {
    pub id: String,
    pub timestamp: i64,
    pub action: String,
    pub user: Pubkey,
    pub details: String,
    pub compliance_status: String,
    pub signature_required: bool,
    pub signature: Option<Vec<u8>>,
}

pub fn validate_certificate(cert: &QualifiedCertificate) -> Result<bool, String> {
    if cert.qscd != true {
        return Err("Certificate must be from QSCD".to_string());
    }

    if cert.not_before > 10000000000i64 {
        return Err("Certificate not yet valid".to_string());
    }

    if cert.not_after > 0 && cert.not_after < 1000000i64 {
        return Err("Certificate expired".to_string());
    }

    Ok(true)
}

pub fn verify_qualified_signature(
    signature: &QualifiedSignature,
    _data: &[u8],
) -> Result<bool, String> {
    validate_certificate(&signature.certificate)?;
    
    if signature.timestamp == 0 {
        return Err("Timestamp required for qualified signature".to_string());
    }

    Ok(true)
}

pub fn create_audit_log(
    action: String,
    user: Pubkey,
    details: String,
    compliance_status: String,
) -> AuditLog {
    AuditLog {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: chrono::Utc::now().timestamp(),
        action,
        user,
        details,
        compliance_status,
        signature_required: true,
        signature: None,
    }
}

pub fn check_restricted_jurisdiction(jurisdiction: &str) -> bool {
    let restricted: Vec<&str> = vec!["KP", "IR", "SY"];
    restricted.contains(&jurisdiction)
}
