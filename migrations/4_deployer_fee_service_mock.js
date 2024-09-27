const FeeServiceMock = artifacts.require("FeeServiceMock");

module.exports = async function (deployer) {
  await deployer.deploy(FeeServiceMock);
};
