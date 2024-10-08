const ContractManager = artifacts.require("ContractService");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("../../utils/helpers");

async function instance(account) {
  let signer = await getSigner(account);
  let mockContractManager = await deployMockContract(
    signer,
    ContractManager.abi
  );

  await mockContractManager.mock.getERC20.returns([
    ["0xfC4B15EA75dc36CEf08D92031F9C3c3b495c0Cb0", 18],
  ]);

  await mockContractManager.mock.addWhitelistedERC20.returns(true);

  await mockContractManager.mock.getERC721.returns([
    "0xfC4B15EA75dc36CEf08D92031F9C3c3b495c0Cb0",
  ]);

  await mockContractManager.mock.addWhitelistedERC721.returns(true);

  await mockContractManager.mock.getPairForTokens.returns(
    "0xfC4B15EA75dc36CEf08D92031F9C3c3b495c0Cb0" // Single address
  );
  return mockContractManager;
}

module.exports = {
  instance,
};
