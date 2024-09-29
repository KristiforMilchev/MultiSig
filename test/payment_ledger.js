const PaymentLedger = artifacts.require("PaymentLedger");
const OwnerManager = artifacts.require("OwnerManager");
const LedgerSettings = artifacts.require("LedgerSettings");
const MockERC20 = artifacts.require("MockERC20");
const MockERC721 = artifacts.require("MockERC721");
const { getNonce, getAddress } = require("./../utils/helpers");
contract("PaymentLedger", (accounts) => {
  let paymentLedger;
  let ownerManager;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];
  const initialMaxDailyTransactions = 5;
  const initialMaxTransactionAmountUSD = 10000;
  let mockERC20;
  let mockERC721;
  let nonce;
  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  before(async () => {
    mockERC20 = await MockERC20.new("Mock Token", "MTK", 18);
    mockERC721 = await MockERC721.new("Mock NFT", "MNFT");
    let deployedOwnerManager = await OwnerManager.new(owners);
    let deployLedgerSettings = await LedgerSettings.new(
      deployedOwnerManager.address,
      true,
      initialMaxDailyTransactions,
      true,
      initialMaxTransactionAmountUSD
    );
    paymentLedger = await PaymentLedger.new(
      "Payment Ledger",
      deployedOwnerManager.address,
      deployLedgerSettings.address,
      [[mockERC20.address, 18]],
      [mockERC721.address],
      "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526", // Mock price feed address
      "0x6725F303b657a9451d8BA641348b6761A6CC7a17", // Mock factory address
      "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // Mock wrapped token address
      "defaultFactory" // Default factory name
    );
    nonce = await getNonce(accounts[0]);
    await sleep(100);
  });

  describe("Initialization", () => {
    it("should set the correct name", async () => {
      const name = await paymentLedger.getName();
      assert.equal(name, "Payment Ledger");
    });

    it("should initialize owners correctly", async () => {
      const contractOwners = await paymentLedger.getOwners();
      assert.deepEqual(contractOwners, owners);
    });
  });

  describe("Whitelisted ERC20", () => {
    it("should add a whitelisted ERC20 token", async () => {
      nonce = await getNonce(accounts[0]);

      await paymentLedger.addWhitelistedERC20(
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        18,
        {
          nonce: nonce,
        }
      );
      const whitelistedTokens = await paymentLedger.getERC20();
      assert.equal(whitelistedTokens.length, 2);
      assert.equal(
        whitelistedTokens[1].contractAddress,
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
      );
    });

    it("should revert when adding an already whitelisted ERC20 token", async () => {
      try {
        nonce = await getNonce(accounts[0]);

        await paymentLedger.addWhitelistedERC20(mockERC20.address, 18, {
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Token already whitelisted"));
      }
    });
  });

  describe("Whitelisted ERC721", () => {
    it("should revert when adding an already whitelisted ERC721 token", async () => {
      try {
        nonce = await getNonce(accounts[0]);
        await paymentLedger.addWhitelistedERC721(mockERC721.address, {
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Token already whitelisted"));
      }
    });
    it("should add a whitelisted ERC721 token", async () => {
      nonce = await getNonce(accounts[0]);

      await paymentLedger.addWhitelistedERC721(
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        {
          nonce: nonce,
        }
      );
      const whitelistedTokens = await paymentLedger.getERC721();
      assert.equal(whitelistedTokens.length, 2);
      assert.equal(
        whitelistedTokens[1],
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
      );
    });
  });
  describe("Transaction Proposals", () => {
    it("should propose a payment", async () => {
      nonce = await getNonce(accounts[0]);
      await paymentLedger.proposePayment(
        1000,
        owner2,
        "0x0000000000000000000000000000000000000000",
        { nonce: nonce }
      );
      const transactions = await paymentLedger.getTransactionHistory();
      assert.equal(transactions.length, 1);
      assert.equal(transactions[0].amount.toString(), "1000");
      assert.equal(transactions[0].to, owner2);
    });

    it("should approve a payment", async () => {
      nonce = await getNonce(owner1);
      await paymentLedger.proposePayment(
        1000,
        owner2,
        "0x0000000000000000000000000000000000000000",
        {
          nonce: nonce,
        }
      );

      const nonceForOwner2 = await getNonce(owner2);
      await paymentLedger.approvePayment(1, {
        from: owner2,
        nonce: nonceForOwner2,
      });

      const transaction = await paymentLedger.getTransactionById(1);
      assert.equal(transaction.approval.length, 2);
      const allVotesAreTrue = transaction.approval.every(
        (approvalObj) => approvalObj.vote === true
      );
      assert.isTrue(
        allVotesAreTrue,
        "Not all votes are true in the approval array"
      );
    });

    it("should revert if an owner tries to approve the same payment twice", async () => {
      nonce = await getNonce(owner1);
      await paymentLedger.proposePayment(
        1000,
        owner2,
        "0x0000000000000000000000000000000000000000",
        {
          nonce: nonce,
        }
      );
      const paymentId = 2;

      try {
        nonce = await getNonce(owner1);

        await paymentLedger.approvePayment(paymentId, {
          from: owner1,
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(
          error.message.includes("Owner has already approved this transaction")
        );
      }
    });

    it("should revert when approving a non-existent payment", async () => {
      try {
        nonce = await getNonce(owner1);
        await paymentLedger.approvePayment(9999, {
          from: owner1,
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Transaction not found"));
      }
    });

    it("should revert when the transaction amount exceeds the max limit", async () => {
      try {
        nonce = await getNonce(owner1);
        await paymentLedger.proposePayment(
          20000,
          owner2,
          "0x0000000000000000000000000000000000000000",
          {
            nonce: nonce,
          }
        );
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(
          error.message.includes("Transaction exceeds max amount limit")
        );
      }
    });
  });

  describe("NFT Transfer Proposals", () => {
    it("should propose an NFT transfer", async () => {
      nonce = await getNonce(owner1);
      await mockERC721.mint(paymentLedger.address, 1, {
        nonce: nonce,
      });
      nonce = await getNonce(owner1);

      await paymentLedger.proposeNftTransfer(mockERC721.address, owner2, 1, {
        nonce: nonce,
      });
      const nftTransaction = await paymentLedger.getNftTransactionById(1);
      assert.equal(nftTransaction.to, owner2);
      assert.equal(nftTransaction.amount.toString(), "1");
    });

    it("should approve an NFT transfer", async () => {
      const owner2Nonce = await getNonce(owner2);
      await paymentLedger.approveNftTransfer(1, {
        from: owner2,
        nonce: owner2Nonce,
      });
      nftTransaction = await paymentLedger.getNftTransactionById(1);
      assert.equal(nftTransaction.approval.length, 2);
      const allVotesAreTrue = nftTransaction.approval.every(
        (approvalObj) => approvalObj.vote === true
      );
      assert.isTrue(allVotesAreTrue, "Approving NFT Trasnfer failed");
    });

    it("should revert if an owner tries to approve the same NFT transfer twice", async () => {
      try {
        nonce = await getNonce(owner1);
        await paymentLedger.approveNftTransfer(1, {
          from: owner1,
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(
          error.message.includes("Owner has already approved this transaction")
        );
      }
    });
  });
  describe("Settings Proposal", () => {
    it("should propose a settings change", async () => {
      const ledgerSettings = await paymentLedger.getLedgerSettings();
      const settingsInstance = await LedgerSettings.at(ledgerSettings);
      nonce = await getNonce(owner1);
      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );

      const proposalId = transaction.logs[0].args.id;
      const settingsProposal = await settingsInstance.getSettingProposalById(
        proposalId
      );
      assert.equal(settingsProposal.maxDailyTransactions.toString(), "10");
      assert.equal(settingsProposal.maxTransactionAmountUSD.toString(), "5000");
    });

    it("should approve settings change", async () => {
      const ledgerSettings = await paymentLedger.getLedgerSettings();
      const settingsInstance = await LedgerSettings.at(ledgerSettings);

      nonce = await getNonce(owner1);
      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );
      const proposalId = transaction.logs[0].args.id;

      const nonceOwner2 = await getNonce(owner2);
      await settingsInstance.approveSettingsChange(proposalId, {
        from: owner2,
        nonce: nonceOwner2,
      });
      const settingsProposal = await settingsInstance.getSettingProposalById(
        proposalId
      );
      assert.equal(
        settingsProposal.approvals.length,
        2,
        "Expected proposal approvals to be 2, got 1"
      );
    });

    it("should revert when trying to approve an already executed proposal", async () => {
      const ledgerSettings = await paymentLedger.getLedgerSettings();
      const settingsInstance = await LedgerSettings.at(ledgerSettings);

      nonce = await getNonce(owner1);

      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );
      const proposalId = transaction.logs[0].args.id;
      const owner2Nonce = await getNonce(owner2);
      const owner3Nonce = await getNonce(owner3);
      await settingsInstance.approveSettingsChange(proposalId, {
        from: owner2,
        nonce: owner2Nonce,
      });

      try {
        await settingsInstance.approveSettingsChange(proposalId, {
          from: owner3,
          nonce: owner3Nonce,
        });
        await settingsInstance.getSettingProposalById(proposalId);
        nonce = await getNonce(owner1);

        await settingsInstance.approveSettingsChange(proposalId, {
          from: owner1,
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Proposal already executed"));
      }
    });
  });

  describe("Owner Management", () => {
    it("should propose a new owner", async () => {
      nonce = await getNonce(owner1);
      const newOwnerAddress = accounts[3];
      const managerAddress = await paymentLedger.getOwnerManager();
      const manager = await OwnerManager.at(managerAddress);

      const transaction = await manager.proposeOwner(newOwnerAddress, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;
      const proposal = await manager.getOwnerProposal(proposalId);
      assert.equal(proposal.newOwner, newOwnerAddress);
    });
    it("should approve a new owner", async () => {
      const managerAddress = await paymentLedger.getOwnerManager();
      const manager = await OwnerManager.at(managerAddress);

      nonce = await getNonce(owner1);
      const newOwnerAddress = accounts[3];
      const transaction = await manager.proposeOwner(newOwnerAddress, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;
      const owner2Nonce = await getNonce(owner2);
      await manager.approveOwner(proposalId, {
        from: owner2,
        nonce: owner2Nonce,
      });
      const proposal = await manager.getOwnerProposal(proposalId);
      assert.equal(proposal.votes.length, 2);
    });

    it("should revert if a non-owner tries to approve a new owner", async () => {
      const managerAddress = await paymentLedger.getOwnerManager();
      const manager = await OwnerManager.at(managerAddress);

      nonce = await getNonce(owner1);
      const newOwnerAddress = accounts[3];
      const transaction = await manager.proposeOwner(newOwnerAddress, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;
      try {
        const nonOwnerNonce = await getNonce(newOwnerAddress);
        await manager.approveOwner(proposalId, {
          from: accounts[3],
          nonce: nonOwnerNonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Not authorized"));
      }
    });
    it("Should propose to remove an owner", async () => {
      try {
        const managerAddress = await paymentLedger.getOwnerManager();
        const manager = await OwnerManager.at(managerAddress);

        nonce = await getNonce(owner1);
        const transaction = await manager.proposeOwnerToBeRemoved(owner3, {
          nonce: nonce,
        });
        const proposalId = transaction.logs[0].args.id.toNumber();
        const updatedOwners = await manager.getRemoveOwnerProposal(proposalId);
        assert.equal(
          updatedOwners.votes.length,
          1,
          "Failed to propose owner removal."
        );
      } catch (ex) {
        assert.fail("Just Fails!");
      }
    });
    it("Should propose and approve owner removal", async () => {
      const managerAddress = await paymentLedger.getOwnerManager();
      const manager = await OwnerManager.at(managerAddress);

      nonce = await getNonce(owner1);
      const transaction = await manager.proposeOwnerToBeRemoved(owner3, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;
      const owner2Nonce = await getNonce(owner2);
      await manager.approveOwnerRemove(proposalId, {
        from: owner2,
        nonce: owner2Nonce,
      });
      const updatedOwners = await manager.getRemoveOwnerProposal(proposalId);
      assert.equal(
        updatedOwners.votes.length,
        2,
        "Failed to approve request when voting for owner to be removed."
      );
    });
    it("Should remove an owner", async () => {
      const managerAddress = await paymentLedger.getOwnerManager();
      const manager = await OwnerManager.at(managerAddress);

      nonce = await getNonce(owner1);
      const transaction = await manager.proposeOwnerToBeRemoved(owner3, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;
      const owner2Nonce = await getNonce(owner2);
      await manager.approveOwnerRemove(proposalId, {
        from: owner2,
        nonce: owner2Nonce,
      });

      await manager.getRemoveOwnerProposal(proposalId);
      const owners = await manager.getOwners();
      assert.equal(owners.length, 2, "Failed to propose owner removal.");
    });
    it("should revert when trying to remove the last owner", async () => {
      try {
        const managerAddress = await paymentLedger.getOwnerManager();
        const manager = await OwnerManager.at(managerAddress);

        nonce = await getNonce(owner1);
        const transaction = await manager.proposeOwnerToBeRemoved(owner2, {
          nonce: nonce,
        });
        const proposalId = transaction.logs[0].args.id;

        const contractOwners = await manager.getOwners();
        nonce = await getNonce(owner1);
        await manager.approveOwnerRemove(proposalId, {
          from: owner1,
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(true);
      }
    });
  });
});
