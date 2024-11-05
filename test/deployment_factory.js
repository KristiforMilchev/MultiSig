const DeploymentFactory = artifacts.require("DeploymentFactory");
const OwnerManager = artifacts.require("OwnerManager");
const PaymentLedger = artifacts.require("PaymentLedger");

const Aggregator = artifacts.require("AggregatorV3");
const { getNonce, getDeadAddres, delay } = require("./../utils/helpers");
const MockLedgerSettings = require("./mocks/ledger_setting");
const MockOwnerManager = require("./mocks/owner_manager");
const MockFeeService = require("./mocks/fee_service_mock");
const MockContractManager = require("./mocks/contract_manager");
require("dotenv").config();

contract("DeploymentFactory", function (accounts) {
  let mockOwnerManager;
  let mockLedgerSettings;
  let mockFeeService;
  let mockContractService;
  let deadAddress;
  const owner = accounts[0];
  let feeInWei = 90000000000000;
  let fee;
  feeInWei = fee;
  let instance;
  let administrators = [accounts[0], accounts[1], accounts[2]];
  let aggregator;

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
      aggregator = await Aggregator.new();
      var fees = await mockFeeService.getFeeInEthAndUsd();
      feeInWei = fees[0];
      console.log("Factory:", process.env.PKSwapFactory);
      console.log("Wrapped Token:", process.env.WrappedToken);
      instance = await DeploymentFactory.new(
        mockFeeService.address,
        aggregator.address,
        process.env.PKSwapFactory,
        process.env.WrappedToken,
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

  it("Should create new ledger and return the owners service contract", async function () {
    try {
      const nonce = await getNonce(owner);
      console.log("Owner Service Address arugment", mockOwnerManager.address);
      const receipt = await instance.createLedger(
        "Test Ledger",
        mockOwnerManager.address,
        mockLedgerSettings.address,
        mockContractService.address,
        { value: feeInWei, nonce: nonce }
      );

      console.log(receipt.logs[0]);
      const ledger = await PaymentLedger.at(receipt.logs[0].args[0]);
      const ownersServiceAddress = await ledger.getOwnerManager();
      console.log("ownersServiceAddress", ownersServiceAddress);
      const ownerService = await OwnerManager.at(ownersServiceAddress);
      const ownersList = await ownerService.getOwners();

      console.log(ownersList);
      assert.equal(
        receipt.logs[0].event,
        "LedgerCreated",
        "LedgerCreated event was not emitted"
      );
    } catch (ex) {
      console.log(ex);
      assert.fail("Should not revert!");
    }
  });
});
