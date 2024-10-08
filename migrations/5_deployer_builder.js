const DeployementBuilder = artifacts.require("DeploymentBuilder");

module.exports = async function (deployer) {
  await deployer.deploy(
    DeployementBuilder,
    "0x6725F303b657a9451d8BA641348b6761A6CC7a17", // Factory for the PKSWAP deployed on my testnet,
    "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // Network wrapped token
    "PkSwap"
  );
};
