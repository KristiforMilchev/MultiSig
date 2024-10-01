const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("./../../utils/helpers");
const AggregatorV3 = artifacts.require("AggregatorV3");

async function instance(account) {
  let signer = await getSigner(account);
  let mockAggregator = await deployMockContract(signer, AggregatorV3.abi);

  const priceInWei = 1800 * 1e8;

  await mockAggregator.mock.latestRoundData.returns(1, priceInWei, 0, 0, 0);
  await mockAggregator.mock.getRoundData.returns(1, priceInWei, 0, 0, 0);
  await mockAggregator.mock.decimals.returns(8);
  await mockAggregator.mock.version.returns(1);

  return mockAggregator;
}

module.exports = {
  instance,
};
