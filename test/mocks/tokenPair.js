const tokenPair = require("./abis/ITokenPairV2.json");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("./../../utils/helpers");

async function instance(account) {
  let signer = await getSigner(account);
  let mockTokenPair = await deployMockContract(signer, tokenPair);
  await mockTokenPair.mock.getReserves.returns(
    BigInt(173816106297491408),
    BigInt(19950626297333271594402880),
    1234567890
  );
  await mockTokenPair.mock.balanceOf.returns(5000);
  await mockTokenPair.mock.symbol.returns("TT");
  await mockTokenPair.mock.totalSupply.returns(BigInt(1862108376166765960423));
  await mockTokenPair.mock.decimals.returns(18);
  await mockTokenPair.mock.token0.returns(mockTokenPair.address);
  await mockTokenPair.mock.token1.returns(
    "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
  );

  return mockTokenPair;
}

module.exports = {
  instance,
};
