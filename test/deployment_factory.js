const DeploymentFactory = artifacts.require("DeploymentFactory");
const { getNonce, getDeadAddres } = require("./../utils/helpers");
const MockLedgerSettings = require("./mocks/ledger_setting");
const MockOwnerManager = require("./mocks/owner_manager");
const MockFeeService = require("./mocks/fee_service_mock");
const MockContractManager = require("./mocks/contract_manager");

contract("DeploymentFactory", function (accounts) {
  let mockOwnerManager;
  let mockLedgerSettings;
  let mockFeeService;
  let mockContractService;
  let deadAddress;
  let erc20 = [
    ["0xae13d989dac2f0debff460ac112a837c89baa7cd", 18],
    ["0xf30ecfba5166f68e59ef00bdd529232a4fe72dcc", 14],
  ];
  let nfts = ["0xfbe4ea6ad7146a6ed40013d60a32519472f1e81a"];
  const owner = accounts[0];
  let feeInWei = 90000000000000;
  let fee;
  feeInWei = fee;
  let instance;
  let administrators = [accounts[0], accounts[1], accounts[2]];

  before(async () => {
    try {
      deadAddress = getDeadAddres();
      mockOwnerManager = await MockOwnerManager.instance(owner, administrators);
      mockLedgerSettings = await MockLedgerSettings.instance(
        owner,
        administrators
      );
      mockFeeService = await MockFeeService.instance(owner);
      console.log(mockFeeService.address);

      mockContractService = await MockContractManager.instance(owner);

      var fees = await mockFeeService.getFeeInEthAndUsd();
      feeInWei = fees[0];
      instance = await DeploymentFactory.new(
        mockFeeService.address,
        "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
        "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
        "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        "PkSwap",
        "0x"
      );
    } catch (ex) {
      console.log(ex);
      assert.fail("Deployment Factory should deploy without errors!");
    }
  });

  it("should assert true", async function () {
    return assert.isTrue(instance != null && instance != undefined);
  });

  it("Should create new ledger", async function () {
    const nonce = await getNonce(owner);
    const receipt = await instance.createLedger(
      "Test Ledger",
      mockOwnerManager.address,
      mockLedgerSettings.address,
      mockContractService.address,
      { value: feeInWei, nonce: nonce }
    );
    assert.equal(
      receipt.logs[0].event,
      "LedgerCreated",
      "LedgerCreated event was not emitted"
    );
  });

  it("Should fail to create a ledger if least 1 administrator is provided.", async function () {
    try {
      let emptyManager = await MockOwnerManager.instance(owner, []);
      const nonce = await getNonce(owner);
      await instance.createLedger(
        "Test Ledger",
        emptyManager.address,
        mockLedgerSettings.address,
        mockContractService.address,
        { value: feeInWei, nonce: nonce }
      );
      assert.fail("Expected revert not received"); // If the call doesn't revert, fail the test
    } catch (error) {
      assert(
        error.message.includes("Least one administrator should be present"),
        `Expected 'Least one administrator should be present' error, got: ${error.message}`
      );
    }
  });
  it("Should allow to withdraw funds for owner.", async function () {
    const nonce = await getNonce(owner);
    const receipt = await instance.withdraw({
      from: owner,
      nonce: nonce,
    });
    assert.equal(
      receipt.logs[0].event,
      "BalanceTrasfered",
      "BalanceTrasfered event was not emitted"
    );
  });
  it("Withdraw should not error out if balance is 0, EmptyBalance has to be emited.", async function () {
    const nonce = await getNonce(owner);
    const receipt = await instance.withdraw({
      from: owner,
      nonce: nonce,
    });
    assert.equal(
      receipt.logs[0].event,
      "EmptyBalance",
      "EmptyBalance event was not emitted"
    );
  });

  it("Should deny withdraw of funds for others than owner.", async function () {
    try {
      const nonOwner = accounts[1];
      var newOwnerNonce = await getNonce(nonOwner);

      await instance.withdraw({ from: nonOwner, nonce: newOwnerNonce });
      assert.fail("Expected revert not received");
    } catch (error) {
      assert(
        error.message.includes("Not authorized"),
        "Expected 'Not authorized' error, got: " + error.message
      );
    }
  });
});
