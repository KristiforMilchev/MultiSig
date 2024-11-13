const ContractService = artifacts.require("ContractService");
const { getDeadAddres, getNonce, delay } = require("./../utils/helpers");
const assert = require("assert");
const MockPKV2 = require("./mocks/pkv2");
const MockOwnerManager = require("./mocks/owner_manager");
const MockTokenPair = require("./mocks/tokenPair");
const MockERC20 = artifacts.require("MockERC20");
const MockERC721 = artifacts.require("MockERC721");
require("dotenv").config();

contract("ContractService", function (accounts) {
  let instance;
  let mockPKV2;
  let mockOwnerManager;
  let mockTokenPair;
  let dead;
  let mockERC20;
  let mockERC721;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];

  before(async () => {
    mockERC20 = await MockERC20.new("Mock Token", "MTK", 18);
    mockERC721 = await MockERC721.new("Mock NFT", "MNFT");
    mockTokenPair = await MockTokenPair.instance(accounts[0]);
    mockPKV2 = await MockPKV2.instance(accounts[0], mockTokenPair.address);
    mockOwnerManager = await MockOwnerManager.instance(accounts[0], owners);
    dead = getDeadAddres();
    instance = await ContractService.new();
    await instance.init(
      mockPKV2.address,
      process.env.WrappedToken,
      mockOwnerManager.address,
      "PkSwap",
      [],
      []
    );
  });

  it("Should return an error if a factory doesn't exist.", async () => {
    const factoryName = "FactoryDoesntExist";

    try {
      await instance.getPairForTokens(dead, factoryName);
      assert.fail("The function did not revert as expected");
    } catch (error) {
      assert(error.code == -32000, "Expected revert, got another error!");
    }
  });

  it("Should return pair for token in factory that exists", async () => {
    try {
      const pair = await instance.getPairForTokens(
        mockTokenPair.address,
        "PkSwap"
      );
      console.log("Contract is :", pair);
      assert.notEqual(
        pair,
        dead,
        "Expected to get factory address, recived dead address factory is not defined!"
      );
    } catch (ex) {
      console.log(ex);
      assert.fail("Shouldn't error");
    }
  });

  describe("Whitelisted ERC20", () => {
    it("should add a whitelisted ERC20 token", async () => {
      nonce = await getNonce(accounts[0]);

      await instance.addWhitelistedERC20(
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        18,
        {
          nonce: nonce,
        }
      );
      const whitelistedTokens = await instance.getERC20();
      assert.equal(whitelistedTokens.length, 1);
      assert.equal(
        whitelistedTokens[0].contractAddress,
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
      );
    });

    it("should revert when adding an already whitelisted ERC20 token", async () => {
      try {
        nonce = await getNonce(accounts[0]);

        await instance.addWhitelistedERC20(
          "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
          18,
          {
            nonce: nonce,
          }
        );
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.equal(error.message.includes("Token already whitelisted"), true);
      }
    });
  });

  describe("Whitelisted ERC721", () => {
    it("should add a whitelisted ERC721 token", async () => {
      nonce = await getNonce(accounts[0]);

      await instance.addWhitelistedERC721(
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        {
          nonce: nonce,
        }
      );
      const whitelistedTokens = await instance.getERC721();
      assert.equal(whitelistedTokens.length, 1);
      assert.equal(
        whitelistedTokens[0],
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
      );
    });

    it("should revert when adding an already whitelisted ERC721 token", async () => {
      try {
        nonce = await getNonce(accounts[0]);
        await instance.addWhitelistedERC721(
          "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
          {
            nonce: nonce,
          }
        );
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.equal(error.message.includes("Token already whitelisted"), true);
      }
    });
  });
});
