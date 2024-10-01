const FeeService = artifacts.require("FeeService");
const { getNonce } = require("./../utils/helpers");
const assert = require("assert");
const MockAggregatorV3 = require("./mocks/aggregator_v3_interface");

contract("FeeService", function (accounts) {
  let feeService;
  let mockAggregator;

  before(async () => {
    mockAggregator = await MockAggregatorV3.instance(accounts[0]);

    feeService = await FeeService.new(mockAggregator.address, accounts[0], 10);
  });

  it("should return the correct fee in ETH and USD", async () => {
    const result = await feeService.getFeeInEthAndUsd();

    const feeInWei = result.feeInWei.toString();
    const feeInUsdValue = result.feeInUsdValue.toString();

    assert.equal(feeInWei > 0, true, "Fee in Wei should be greater than zero");
    assert.equal(
      feeInUsdValue,
      web3.utils.toWei("10", "ether"),
      "Fee in USD should be 10 USD in Wei units"
    );
  });
  it("Should convert USD to Wei", async () => {
    try {
      const amount = await feeService.convertUsdToWei(18);
      const ethPrice = 1800 * 1e8;
      const expectedWei = Math.floor((18 * 1e18) / ethPrice);

      assert.equal(
        amount.toString(),
        expectedWei.toString(),
        "The converted amount should be correct"
      );
    } catch (ex) {
      console.log(ex);
      assert.fail("Failed to retrive usd in wei");
    }
  });

  it("should update the fee correctly", async () => {
    let nonce = await getNonce(accounts[0]);
    await feeService.changeTax(20, { from: accounts[0], nonce: nonce });

    const updatedFee = await feeService.getFeeInEthAndUsd();
    const updatedFeeInUsdValue = updatedFee.feeInUsdValue.toString();

    assert.equal(
      updatedFeeInUsdValue,
      web3.utils.toWei("20", "ether"),
      "Fee in USD should be 20 USD in Wei units"
    );
  });

  it("Should return price greater than zero at the current block", async () => {
    const price = await feeService.getLatestPrice();
    assert.notEqual(price, 0, "Price returned from price feed is 0");
  });

  // it("should deny others than the deployer to update fees", async () => {
  //   let nonce = await getNonce(accounts[1]);
  //   await feeService.changeTax(20, { from: accounts[1], nonce: nonce });
  //   assert.fail(
  //     "Expected reverted, other accounts than owner shouldn't be able to update fees!"
  //   );
  // });
});
