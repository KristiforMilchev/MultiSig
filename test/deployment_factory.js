const DeploymentFactory = artifacts.require("DeploymentFactory");
const FeeServiceMock = require("./mocks/fee_service_mock"); // Adjust the path accordingly
const { getNonce } = require("./../utils/helpers");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("DeploymentFactory", function (accounts) {
  let deadAddress = "0x0000000000000000000000000000000000000000";
  let erc20 = [
    ["0xae13d989dac2f0debff460ac112a837c89baa7cd", 18],
    ["0xf30ecfba5166f68e59ef00bdd529232a4fe72dcc", 14],
  ];
  let nfts = ["0xfbe4ea6ad7146a6ed40013d60a32519472f1e81a"];
  const owner = accounts[0];
  let feeInWei;
  let feeService = new FeeServiceMock();
  let [fee, _] = feeService.getFeeInEthAndUsd();
  feeInWei = fee;
  let instance;
  let administrators = [
    "0xc0c5416245be058f9c0373f389d6e467959cbfeb",
    "0x7d9717761ee1c64908d9b57fb9adfb238057c96a",
    "0x72c97d752c861842e96d78f485920674ce14053d",
  ];

  before(async () => {
    instance = await DeploymentFactory.new(
      "0x79309f7f8f1A5661bfc98dAeBB470fe618ebb1ee",
      "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
      "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
      "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      "PkSwap"
    );
  });

  it("should assert true", async function () {
    return assert.isTrue(instance != null && instance != undefined);
  });

  it("Should create new ledger, no rate limit", async function () {
    const receipt = await instance.createLedger(
      "Test Ledger",
      administrators,
      erc20,
      nfts,
      true,
      10,
      false,
      0,
      { value: feeInWei, nonce: await getNonce(owner) }
    );
    assert.equal(
      receipt.logs[0].event,
      "LedgerCreated",
      "LedgerCreated event was not emitted"
    );
  });
  it("Should create new ledger, no transaction limit", async function () {
    const receipt = await instance.createLedger(
      "Test Ledger",
      administrators,
      erc20,
      nfts,
      false,
      0,
      true,
      2000,
      { value: feeInWei, nonce: await getNonce(owner) }
    );

    assert.equal(
      receipt.logs[0].event,
      "LedgerCreated",
      "LedgerCreated event was not emitted"
    );
  });
  it("Should create new ledger, no rate limit, no transaction limit", async function () {
    const receipt = await instance.createLedger(
      "Test Ledger",
      administrators,
      erc20,
      nfts,
      false,
      0,
      false,
      0,
      { value: feeInWei, nonce: await getNonce(owner) }
    );

    assert.equal(
      receipt.logs[0].event,
      "LedgerCreated",
      "LedgerCreated event was not emitted"
    );
  });
  it("Should create new ledger, no rate limit, no transaction limit, no initial assets", async function () {
    const receipt = await instance.createLedger(
      "Test Ledger",
      administrators,
      [],
      [],
      false,
      0,
      false,
      0,
      { value: feeInWei, nonce: await getNonce(owner) }
    );

    assert.equal(
      receipt.logs[0].event,
      "LedgerCreated",
      "LedgerCreated event was not emitted"
    );
  });
  it("Should fail to create a ledger if least 1 administrator is provided.", async function () {
    try {
      await instance.createLedger(
        "Test Ledger",
        [], // No administrators
        [],
        [],
        false,
        0,
        false,
        0,
        {
          value: feeInWei,
          nonce: await getNonce(owner),
        }
      );
      assert.fail("Expected revert not received"); // If the call doesn't revert, fail the test
    } catch (error) {
      // Check for the specific revert reason in the error message
      assert(
        error.message.includes("Least one administrator should be present"),
        `Expected 'Least one administrator should be present' error, got: ${error.message}`
      );
    }
  });
  it("Should allow to withdraw funds for owner.", async function () {
    await instance.createLedger(
      "Test Ledger",
      [owner],
      [],
      [],
      false,
      0,
      false,
      0,
      { value: feeInWei, nonce: await getNonce(owner) }
    );

    const receipt = await instance.withdraw({
      from: owner,
      nonce: await getNonce(owner),
    });
    assert.equal(
      receipt.logs[0].event,
      "BalanceTrasfered",
      "BalanceTrasfered event was not emitted"
    );
  });
  it("Withdraw should not error out if balance is 0, EmptyBalance has to be emited.", async function () {
    const receipt = await instance.withdraw({
      from: owner,
      nonce: await getNonce(owner),
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
