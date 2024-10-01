const ContractService = artifacts.require("ContractService");
const { getDeadAddres } = require("./../utils/helpers");
const assert = require("assert");
const MockPKV2 = require("./mocks/pkv2");
const MockTokenPair = require("./mocks/tokenPair");
const { TransactionTypes } = require("ethers/lib/utils");

contract("ContractService", function (accounts) {
  let instance;
  let mockPKV2;
  let mockTokenPair;
  let dead;
  before(async () => {
    mockTokenPair = await MockTokenPair.instance(accounts[0]);
    mockPKV2 = await MockPKV2.instance(accounts[0], mockTokenPair.address);
    dead = getDeadAddres();
    instance = await ContractService.new(
      mockPKV2.address,
      "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      "PkSwap"
    );
  });

  it("Should return an error if a factory doesn't exist.", async () => {
    const factoryName = "FactoryDoesntExist";

    try {
      await instance.getPairForTokens(dead, factoryName);
      assert.fail("The function did not revert as expected");
    } catch (error) {
      assert(
        error.data.includes("0x48fc96f4"),
        `Unexpected error message: ${error.data}`
      );
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
});
