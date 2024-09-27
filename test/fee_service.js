const FeeService = artifacts.require("FeeService");
const MockAggregatorV3 = artifacts.require("AggregatorV3");

contract("FeeService", function (accounts) {
  let feeService;
  let mockAggregator;

  before(async () => {
    mockAggregator = await MockAggregatorV3.new();
    feeService = await FeeService.new(mockAggregator.address, accounts[0], 10);
  });

  it("should return the correct fee in ETH and USD", async () => {
    const result = await feeService.getFeeInEthAndUsd();

    const feeInWei = result.feeInWei.toString();
    const feeInUsdValue = result.feeInUsdValue.toString();

    console.log("Fee in Wei:", feeInWei);
    console.log("Fee in USD (in Wei units):", feeInUsdValue);

    assert.isTrue(feeInWei > 0, "Fee in Wei should be greater than zero");
    assert.equal(
      feeInUsdValue,
      web3.utils.toWei("10", "ether"),
      "Fee in USD should be 10 USD in Wei units"
    );
  });

  it("should update the fee correctly", async () => {
    await feeService.changeTax(20, { from: accounts[0] });

    const updatedFee = await feeService.getFeeInEthAndUsd();
    const updatedFeeInUsdValue = updatedFee.feeInUsdValue.toString();

    assert.equal(
      updatedFeeInUsdValue,
      web3.utils.toWei("20", "ether"),
      "Fee in USD should be 20 USD in Wei units"
    );
  });

  it("should deny others than the deployer to update fees", async () => {
    await feeService.changeTax(20, { from: accounts[1] });
    assert.fail(
      "Expected reverted, other accounts than owner shouldn't be able to update fees!"
    );
  });
});
