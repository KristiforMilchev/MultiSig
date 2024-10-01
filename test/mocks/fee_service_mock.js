const feeService = artifacts.require("FeeService");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("./../../utils/helpers");

async function instance(account) {
  let signer = await getSigner(account);
  let mockFeeService = await deployMockContract(signer, feeService.abi);

  // Mocking the return values
  await mockFeeService.mock.getFeeInEthAndUsd.returns(
    BigInt(900000000000), // feeInWei
    BigInt(100) // feeInUsdValue
  );
  await mockFeeService.mock.getLatestPrice.returns(9000000000);
  await mockFeeService.mock.convertUsdToWei
    .withArgs(100)
    .returns(BigInt(900000000000));
  await mockFeeService.mock.convertWeiToUsd
    .withArgs(BigInt(900000000000))
    .returns(100);
  await mockFeeService.mock.changeTax.returns(true);

  return mockFeeService;
}

module.exports = {
  instance,
};
