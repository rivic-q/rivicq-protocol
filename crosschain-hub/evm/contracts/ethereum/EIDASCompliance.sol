// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract EIDASCompliance is AccessControl {
    
    enum EidasLevel {
        None,
        Basic,
        Substantial,
        High
    }

    struct QualifiedCertificate {
        address subject;
        string issuer;
        bytes serialNumber;
        uint64 notBefore;
        uint64 notAfter;
        bytes publicKeyHash;
        CertificateType certType;
        string country;
        bool qscd;
    }

    enum CertificateType {
        QES,
        QESe,
        WebAuth
    }

    struct QualifiedSignature {
        bytes signature;
        bytes signedData;
        uint256 timestamp;
        string signatureAlgorithm;
        string signerRole;
    }

    struct ComplianceRecord {
        address wallet;
        EidasLevel eidasLevel;
        bool kycVerified;
        bool amlScreened;
        bool restricted;
        uint256 verificationDate;
        uint256 expiryDate;
        string jurisdiction;
    }

    struct AuditLog {
        uint256 id;
        uint256 timestamp;
        string action;
        address user;
        string details;
        string complianceStatus;
        bool signatureRequired;
        bytes signature;
    }

    mapping(address => ComplianceRecord) public complianceRecords;
    mapping(address => mapping(bytes32 => QualifiedSignature)) public signatures;
    mapping(address => bytes[]) public certificateChain;
    mapping(bytes32 => AuditLog[]) public auditLogs;
    mapping(string => bool) public restrictedJurisdictions;
    
    uint256 public auditLogCounter;
    address public trustedTimestampingAuthority;

    event ComplianceUpdated(
        address indexed wallet,
        EidasLevel level,
        bool kycVerified,
        bool amlScreened,
        uint256 timestamp
    );

    event SignatureCreated(
        address indexed signer,
        bytes32 indexed signatureId,
        uint256 timestamp
    );

    event AuditLogCreated(
        uint256 indexed logId,
        string action,
        address user,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        trustedTimestampingAuthority = msg.sender;
        
        restrictedJurisdictions["KP"] = true;
        restrictedJurisdictions["IR"] = true;
        restrictedJurisdictions["SY"] = true;
    }

    function updateComplianceRecord(
        address wallet,
        EidasLevel level,
        bool kyc,
        bool aml,
        string calldata jurisdiction
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!restrictedJurisdictions[jurisdiction], "Restricted jurisdiction");
        
        complianceRecords[wallet] = ComplianceRecord({
            wallet: wallet,
            eidasLevel: level,
            kycVerified: kyc,
            amlScreened: aml,
            restricted: false,
            verificationDate: block.timestamp,
            expiryDate: block.timestamp + 365 days,
            jurisdiction: jurisdiction
        });

        _createAuditLog("COMPLIANCE_UPDATE", wallet, "Compliance record updated");

        emit ComplianceUpdated(wallet, level, kyc, aml, block.timestamp);
    }

    function createQualifiedSignature(
        bytes calldata dataToSign,
        bytes calldata signature
    ) external returns (bytes32) {
        ComplianceRecord memory record = complianceRecords[msg.sender];
        require(record.eidasLevel != EidasLevel.None, "eIDAS level required");
        
        bytes32 signatureId = keccak256(
            abi.encodePacked(msg.sender, dataToSign, block.timestamp)
        );

        signatures[msg.sender][signatureId] = QualifiedSignature({
            signature: signature,
            signedData: dataToSign,
            timestamp: block.timestamp,
            signatureAlgorithm: "ECDSA",
            signerRole: "SIGNER"
        });

        _createAuditLog("SIGNATURE_CREATED", msg.sender, "Qualified signature created");

        emit SignatureCreated(msg.sender, signatureId, block.timestamp);
        
        return signatureId;
    }

    function verifyQualifiedSignature(
        address signer,
        bytes32 signatureId,
        bytes calldata data
    ) external view returns (bool) {
        QualifiedSignature memory sig = signatures[signer][signatureId];
        require(sig.timestamp > 0, "Signature not found");
        require(sig.timestamp >= complianceRecords[signer].verificationDate, "Certificate expired");
        
        return keccak256(sig.signedData) == keccak256(data);
    }

    function requestTimestamp(bytes32 dataHash) external returns (bytes32) {
        bytes32 tsHash = keccak256(
            abi.encodePacked(dataHash, block.timestamp, trustedTimestampingAuthority)
        );
        
        _createAuditLog("TIMESTAMP_REQUESTED", msg.sender, "Timestamp requested");
        
        return tsHash;
    }

    function verifyTimestamp(
        bytes32 tsHash,
        bytes32 dataHash,
        uint256 timestamp
    ) external view returns (bool) {
        bytes32 expectedHash = keccak256(
            abi.encodePacked(dataHash, timestamp, trustedTimestampingAuthority)
        );
        return tsHash == expectedHash;
    }

    function checkTransferAllowed(
        address wallet,
        uint256 amount
    ) external view returns (bool, string memory) {
        ComplianceRecord memory record = complianceRecords[wallet];
        
        if (record.restricted) {
            return (false, "Wallet is restricted");
        }
        
        if (block.timestamp > record.expiryDate) {
            return (false, "Compliance expired");
        }
        
        if (record.eidasLevel == EidasLevel.None && amount > 1_000_000_000e18) {
            return (false, "Large transfers require eIDAS compliance");
        }
        
        if (record.eidasLevel == EidasLevel.Basic && amount > 100_000_000e18) {
            return (false, "Basic eIDAS level transfer limit exceeded");
        }
        
        return (true, "Transfer allowed");
    }

    function _createAuditLog(
        string memory action,
        address user,
        string memory details
    ) internal {
        auditLogCounter++;
        
        auditLogs[bytes32(auditLogCounter)].push(AuditLog({
            id: auditLogCounter,
            timestamp: block.timestamp,
            action: action,
            user: user,
            details: details,
            complianceStatus: "COMPLIANT",
            signatureRequired: true,
            signature: bytes("")
        }));

        emit AuditLogCreated(auditLogCounter, action, user, block.timestamp);
    }

    function getAuditLogs(address user) external view returns (AuditLog[] memory) {
        return auditLogs[bytes32(uint256(uint160(user)))];
    }
}
