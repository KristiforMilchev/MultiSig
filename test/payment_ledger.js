const PaymentLedger = artifacts.require("PaymentLedger");
const OwnerManager = artifacts.require("OwnerManager");
const MockLedgerSettings = require("./mocks/ledger_setting");
const MockOwnerManager = require("./mocks/owner_manager");
const MockFeeService = require("./mocks/fee_service_mock");
const MockContractService = require("./mocks/contract_manager");
const MockERC721 = artifacts.require("MockERC721");
const { getNonce, getDeadAddres, delay } = require("./../utils/helpers");
contract("PaymentLedger", (accounts) => {
  let deadAddress;
  let paymentLedger;
  let mockOwnerManager;
  let mockLedgerSettings;
  let mockContractService;
  let mockFeeService;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];
  let mockERC20;
  let mockERC721;
  let nonce;

  beforeEach(async () => {
    await delay(10000);
  });

  before(async () => {
    deadAddress = getDeadAddres();
    mockERC721 = await MockERC721.new("Mock NFT", "MNFT");

    mockContractService = await MockContractService.instance(owner1);
    deadAddress = getDeadAddres();
    mockOwnerManager = await MockOwnerManager.instance(owner1, owners);
    mockLedgerSettings = await MockLedgerSettings.instance(owner1, owners);
    mockFeeService = await MockFeeService.instance(owner1);
    console.log(mockFeeService.address);
    var fees = await mockFeeService.getFeeInEthAndUsd();
    feeInWei = fees[0];

    paymentLedger = await PaymentLedger.new(
      "Payment Ledger",
      mockOwnerManager.address,
      mockLedgerSettings.address,
      mockContractService.address,
      mockFeeService.address
    );
    nonce = await getNonce(accounts[0]);
  });

  describe("Initialization", () => {
    it("should set the correct name", async () => {
      const name = await paymentLedger.getName();
      assert.equal(name, "Payment Ledger");
    });

    it("should initialize owners correctly", async () => {
      const contractOwnerManager = await paymentLedger.getOwnerManager();
      let currentManager = await OwnerManager.at(contractOwnerManager);
      let contractOwners = await currentManager.getOwners();
      assert.deepEqual(contractOwners, owners);
    });

    it("Price Feed set.", async function () {
      let priceFeed = await paymentLedger.getPriceFeed();
      assert.notEqual(
        priceFeed,
        deadAddress,
        "The network wrapped token should not be the zero address, deployment failed!"
      );
    });
  });

  describe("Transaction Proposals", () => {
    it("should propose a payment", async () => {
      nonce = await getNonce(accounts[0]);
      await paymentLedger.proposePayment(499, owner2, deadAddress, {
        nonce: nonce,
      });
      const transactions = await paymentLedger.getTransactionHistory();
      assert.equal(transactions.length, 1);
      assert.equal(transactions[0].amount.toString(), "499");
      assert.equal(transactions[0].to, owner2);
    });

    it("should approve a payment", async () => {
      nonce = await getNonce(owner1);
      await paymentLedger.proposePayment(499, owner2, deadAddress, {
        nonce: nonce,
      });

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
      try {
        const paymentId = 1;
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

    it("should revert if an owner tries to propose a payment that exceeds the max transaction amount", async () => {
      try {
        nonce = await getNonce(owner1);
        await paymentLedger.proposePayment(500, owner2, deadAddress, {
          nonce: nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(
          error.message.includes("Transaction exceeds max amount limit")
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
        await paymentLedger.proposePayment(20000, owner2, deadAddress, {
          nonce: nonce,
        });
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

    it("should revent when a owner tries to propose more payments than the maximum daily limit", async () => {
      try {
        for (let i = 0; i < 20; i++) {
          nonce = await getNonce(owner1);
          await paymentLedger.proposePayment(50, owner2, deadAddress, {
            nonce: nonce,
          });
        }

        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(
          error.message.includes("Max daily transaction limit reached")
        );
      }
    });
  });

  describe("Owner Management", () => {});
});
