const FeeService = artifacts.require("FeeService");
require("dotenv").config();

const aggregatorV3 = "AggregatorV3";
const AggregatorV3 = artifacts.require(aggregatorV3);
module.exports = async function (deployer) {
  console.log(process.env.PKSwapFactory);
  console.log(process.env.FeeCollectorAddress);

  const networkId = await web3.eth.net.getId();
  const deployedAggregator = AggregatorV3.networks[networkId];
  if (!deployedAggregator) {
    throw new Error(`Contract not found on network with ID ${networkId}`);
  }
  const deployedAggregatorServiceAddress = deployedAggregator.address;
  console.log("Aggregator Service address");
  console.log(deployedAggregatorServiceAddress);

  var instance = await deployer.deploy(FeeService);

  await instance.init(
    deployedAggregatorServiceAddress,
    process.env.FeeCollectorAddress,
    100
  );
};
