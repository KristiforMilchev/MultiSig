const MsFactory = artifacts.require("DeploymentFactory");
require("dotenv").config();

const feeService = "FeeService";
const feeServiceContract = artifacts.require(feeService);
module.exports = async function (deployer) {
  const networkId = await web3.eth.net.getId();
  const deployedFeeService = feeServiceContract.networks[networkId];
  if (!deployedFeeService) {
    throw new Error(`Contract not found on network with ID ${networkId}`);
  }
  const deployedFeeServiceAddress = deployedFeeService.address;
  console.log("Fee Service address");
  console.log(deployedFeeServiceAddress);

  await deployer.deploy(
    MsFactory,
    deployedFeeServiceAddress, // FeeService address used to calculate factory tax in WETH
    // The address of AggregatorV3Interface deployed on my testnet,
    // for other networks you should find the address and replace it
    //(it's reposible for managing price updates when converting units inside the contract.)
    process.env.AggregatorV3Interface,
    process.env.PKSwapFactory, // Factory for the PKSWAP deployed on my testnet,
    process.env.WrappedToken, // Network wrapped token
    "PkSwap",
    "0x"
  );
};
