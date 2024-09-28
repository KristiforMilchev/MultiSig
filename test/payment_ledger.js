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
});
