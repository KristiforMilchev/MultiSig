const DeployementBuilder = artifacts.require("DeploymentBuilder");
require("dotenv").config();

module.exports = async function (deployer) {
  await deployer.deploy(
    DeployementBuilder,
    process.env.PKSwapFactory, // Factory for the PKSWAP deployed on my testnet,
    process.env.WrappedToken, // Network wrapped token
    "PkSwap"
  );
};
