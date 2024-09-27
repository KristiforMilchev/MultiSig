const DeploymentFactory = artifacts.require("DeploymentFactory");
const FeeServiceMock = require("./mocks/fee_service_mock"); // Adjust the path accordingly
/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("DeploymentFactory", function (accounts) {
  let deadAddress = "0x0000000000000000000000000000000000000000";

  const owner = accounts[0];

  let instance;

  beforeEach(async () => {
    instance = await DeploymentFactory.deployed();
  });

  it("should assert true", async function () {
    await DeploymentFactory.deployed();
    return assert.isTrue(true);
  });

  it("Should create new ledger, no rate limit", async function () {});
  it("Should create new ledger, no rate limit, no transaction limit", async function () {});
  it("Should create new ledger, no rate limit, no transaction limit, no initial assets", async function () {});
  it("Should fail to create a ledger if least 1 administrator is provided.", async function () {});
  it("Should allow to withdraw funds for owner.", async function () {
    let feeService = new FeeServiceMock();
    let [feeInWei, _] = feeService.getFeeInEthAndUsd();

    await instance.createLedger(
      "Test Ledger",
      [owner],
      [],
      [],
      false,
      0,
      false,
      0,
      { value: feeInWei }
    );

    const receipt = await instance.withdraw({ from: owner });
    assert.equal(
      receipt.logs[0].event,
      "BalanceTrasfered",
      "BalanceTrasfered event was not emitted"
    );
  });
  it("Withdraw should not error out if balance is 0, EmptyBalance has to be emited.", async function () {
    const receipt = await instance.withdraw({ from: owner });
    assert.equal(
      receipt.logs[0].event,
      "EmptyBalance",
      "EmptyBalance event was not emitted"
    );
  });

  it("Should deny withdraw of funds for others than owner.", async function () {
    try {
      const nonOwner = accounts[1];
      await instance.withdraw({ from: nonOwner });
      assert.fail("Expected revert not received");
    } catch (error) {
      assert(
        error.message.includes("Not authorized"),
        "Expected 'Not authorized' error, got: " + error.message
      );
    }
  });

  it("Price Feed set.", async function () {
    let priceFeed = instance.getPriceFeed();
    assert.notEqual(
      priceFeed,
      deadAddress,
      "The network wrapped token should not be the zero address, deployment failed!"
    );
  });

  it("Network Wrapped Token set .", async function () {
    let tokenAddress = instance.getNetworkToken();
    assert.notEqual(
      tokenAddress,
      deadAddress,
      "The network wrapped token should not be the zero address, deployment failed!"
    );
  });

  it("Default factory set .", async function () {
    let factory = await instance.getPriceFeed();
    assert.notEqual(
      factory,
      deadAddress,
      "The factory address should not be the zero address."
    );
  });
});
