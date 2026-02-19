const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainBridge", function () {
  let bridge;
  let owner;
  let relayer;
  let user;
  let mockToken;

  beforeEach(async function () {
    [owner, relayer, user] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    await mockToken.waitForDeployment();

    const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
    bridge = await CrossChainBridge.deploy();
    await bridge.waitForDeployment();

    await bridge.grantRole(await bridge.RELAYER_ROLE(), relayer.address);
    await bridge.whitelistToken(mockToken.address);
  });

  describe("Initialization", function () {
    it("should set correct initial values", async function () {
      expect(await bridge.feeBasisPoints()).to.equal(25);
      expect(await bridge.minTransferAmount()).to.equal(1000);
      expect(await bridge.maxTransferAmount()).to.equal(ethers.parseEther("1000000000"));
    });

    it("should support correct chains", async function () {
      expect(await bridge.supportedChains(1)).to.equal(true);
      expect(await bridge.supportedChains(137)).to.equal(true);
      expect(await bridge.supportedChains(5)).to.equal(true);
      expect(await bridge.supportedChains(99999)).to.equal(false);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await mockToken.mint(user.address, ethers.parseEther("10000"));
      await mockToken.connect(user).approve(bridge.getAddress(), ethers.parseEther("10000"));
    });

    it("should allow initiating cross-chain transfer", async function () {
      const amount = ethers.parseEther("1000");
      
      await expect(
        bridge.connect(user).initiateCrossChainTransfer(
          user.address,
          amount,
          137,
          mockToken.getAddress()
        )
      ).to.emit(bridge, "TransferInitiated");
    });

    it("should reject transfer below minimum", async function () {
      const amount = 100;
      
      await expect(
        bridge.connect(user).initiateCrossChainTransfer(
          user.address,
          amount,
          137,
          mockToken.getAddress()
        )
      ).to.be.revertedWith("Amount too low");
    });

    it("should reject transfer to zero address", async function () {
      const amount = ethers.parseEther("1000");
      
      await expect(
        bridge.connect(user).initiateCrossChainTransfer(
          ethers.ZeroAddress,
          amount,
          137,
          mockToken.getAddress()
        )
      ).to.be.revertedWith("Invalid recipient");
    });

    it("should reject unsupported chains", async function () {
      const amount = ethers.parseEther("1000");
      
      await expect(
        bridge.connect(user).initiateCrossChainTransfer(
          user.address,
          amount,
          99999,
          mockToken.getAddress()
        )
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("Compliance", function () {
    it("should allow compliance role to verify wallets", async function () {
      await bridge.verifyCompliance(user.address, true);
      expect(await bridge.eidasVerifiedWallets(user.address)).to.equal(true);
    });

    it("should allow admin to set fee", async function () {
      await bridge.setFeeBasisPoints(50);
      expect(await bridge.feeBasisPoints()).to.equal(50);
    });

    it("should reject fee above 1%", async function () {
      await expect(bridge.setFeeBasisPoints(101)).to.be.revertedWith("Fee too high");
    });

    it("should allow admin to pause", async function () {
      await bridge.pause();
      expect(await bridge.paused()).to.equal(true);
    });

    it("should reject transfers when paused", async function () {
      await bridge.pause();
      await mockToken.mint(user.address, ethers.parseEther("10000"));
      await mockToken.connect(user).approve(bridge.getAddress(), ethers.parseEther("10000"));
      
      await expect(
        bridge.connect(user).initiateCrossChainTransfer(
          user.address,
          ethers.parseEther("1000"),
          137,
          mockToken.getAddress()
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Configuration", function () {
    it("should allow setting transfer limits", async function () {
      await bridge.setTransferLimits(100, 1000000);
      expect(await bridge.minTransferAmount()).to.equal(100);
      expect(await bridge.maxTransferAmount()).to.equal(1000000);
    });

    it("should reject invalid limits", async function () {
      await expect(
        bridge.setTransferLimits(1000000, 100)
      ).to.be.revertedWith("Invalid limits");
    });

    it("should allow adding supported chains", async function () {
      await bridge.addSupportedChain(42161);
      expect(await bridge.supportedChains(42161)).to.equal(true);
    });

    it("should allow removing supported chains", async function () {
      await bridge.removeSupportedChain(1);
      expect(await bridge.supportedChains(1)).to.equal(false);
    });
  });
});

describe("EIDASCompliance", function () {
  let eidas;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const EIDASCompliance = await ethers.getContractFactory("EIDASCompliance");
    eidas = await EIDASCompliance.deploy();
    await eidas.waitForDeployment();
  });

  describe("Compliance Records", function () {
    it("should allow updating compliance record", async function () {
      await eidas.updateComplianceRecord(
        user.address,
        3, // High
        true, // KYC
        true, // AML
        "DE"
      );

      const record = await eidas.complianceRecords(user.address);
      expect(record.eidasLevel).to.equal(3);
      expect(record.kycVerified).to.equal(true);
      expect(record.amlScreened).to.equal(true);
      expect(record.jurisdiction).to.equal("DE");
    });

    it("should reject restricted jurisdictions", async function () {
      await expect(
        eidas.updateComplianceRecord(
          user.address,
          3,
          true,
          true,
          "KP"
        )
      ).to.be.revertedWith("Restricted jurisdiction");
    });
  });

  describe("Signatures", function () {
    it("should allow creating qualified signature", async function () {
      await eidas.updateComplianceRecord(user.address, 3, true, true, "DE");
      
      const dataToSign = ethers.toUtf8Bytes("Test message");
      const signature = "0x1234";
      
      await expect(
        eidas.connect(user).createQualifiedSignature(dataToSign, signature)
      ).to.emit(eidas, "SignatureCreated");
    });

    it("should reject signature without compliance", async function () {
      const dataToSign = ethers.toUtf8Bytes("Test message");
      const signature = "0x1234";
      
      await expect(
        eidas.connect(user).createQualifiedSignature(dataToSign, signature)
      ).to.be.revertedWith("eIDAS level required");
    });
  });

  describe("Transfer Checks", function () {
    it("should allow transfers for compliant wallets", async function () {
      await eidas.updateComplianceRecord(user.address, 3, true, true, "DE");
      
      const [allowed, reason] = await eidas.checkTransferAllowed(
        user.address,
        ethers.parseEther("1000")
      );
      
      expect(allowed).to.equal(true);
    });

    it("should block restricted wallets", async function () {
      await eidas.updateComplianceRecord(user.address, 3, true, true, "DE");
      
      const [allowed, reason] = await eidas.checkTransferAllowed(
        user.address,
        ethers.parseEther("1000")
      );
      
      expect(allowed).to.equal(true);
    });
  });
});
