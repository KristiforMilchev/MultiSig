const MockAggregatorV3 = artifacts.require("AggregatorV3");

module.exports = function (deployer) {
  deployer.deploy(MockAggregatorV3);
};
