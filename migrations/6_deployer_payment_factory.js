const MsFactory = artifacts.require("DeploymentFactory");
require("dotenv").config();

const feeServiceContract = artifacts.require("FeeService");
const verificationServiceContract = artifacts.require("VerificationService");

const aggregatorV3 = "AggregatorV3";
const AggregatorV3 = artifacts.require(aggregatorV3);
module.exports = async function (deployer) {
  const networkId = await web3.eth.net.getId();
  const deployedFeeService = feeServiceContract.networks[networkId];
  if (!deployedFeeService) {
    throw new Error(`Contract not found on network with ID ${networkId}`);
  }
  const deployedFeeServiceAddress = deployedFeeService.address;
  console.log("Fee Service address");
  console.log(deployedFeeServiceAddress);

  const deployedVerificationService =
    verificationServiceContract.networks[networkId];
  if (!deployedVerificationService) {
    throw new Error(`Contract not found on network with ID ${networkId}`);
  }
  const deployedVerificationServiceAddress =
    deployedVerificationService.address;
  console.log("Verification Service address");
  console.log(deployedVerificationServiceAddress);

  const deployedAggregator = AggregatorV3.networks[networkId];
  if (!deployedAggregator) {
    throw new Error(`Contract not found on network with ID ${networkId}`);
  }
  const deployedAggregatorServiceAddress = deployedAggregator.address;
  console.log("Aggregator Service address");
  console.log(deployedAggregatorServiceAddress);

  await deployer.deploy(
    MsFactory,
    deployedFeeServiceAddress, // FeeService address used to calculate factory tax in WETH
    deployedAggregatorServiceAddress,
    process.env.PKSwapFactory, // Factory for the PKSWAP deployed on my testnet,
    process.env.WrappedToken, // Network wrapped token
    deployedVerificationServiceAddress,
    "PkSwap"
  );
};
