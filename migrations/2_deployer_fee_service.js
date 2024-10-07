const FeeService = artifacts.require("FeeService");

module.exports = async function (deployer) {
  await deployer.deploy(
    FeeService,
    "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
    "0x72c97d752c861842E96D78F485920674CE14053d",
    100
  );
};
