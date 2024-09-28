const PaymentLedger = artifacts.require("PaymentLedger");
const MockERC20 = artifacts.require("MockERC20");
const MockERC721 = artifacts.require("MockERC721");
const {
  getNonce,
  getNextNonce,
  updateNonceAfterDeployment,
} = require("./../utils/helpers");
contract("PaymentLedger", (accounts) => {
  let paymentLedger;
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

    paymentLedger = await PaymentLedger.new(
      "Payment Ledger",
      owners,
      [[mockERC20.address, 18]],
      [mockERC721.address],
      {
        isMaxDailyTransactionsEnabled: true,
        maxDailyTransactions: initialMaxDailyTransactions,
        isMaxTransactionAmountEnabled: true,
        maxTransactionAmountUSD: initialMaxTransactionAmountUSD,
      },
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
        console.log("created");
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
      console.log(nftTransaction);
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
});
