const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("../../utils/helpers");
const pkswapV2 = require("./abis/pkswapV2.json");

async function instance(account, tokenPair) {
  let signer = await getSigner(account);
  let mockPKV2 = await deployMockContract(signer, pkswapV2);
  await mockPKV2.mock.getPair.returns(tokenPair);
  return mockPKV2;
}

module.exports = {
  instance,
};
