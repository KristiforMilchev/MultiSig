const paymentLedger = artifacts.require("PaymentLedger");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("./../../utils/helpers");

async function instance(
  account,
  ownerService,
  ledgerSettings,
  contractManager,
  feeService
) {
  let signer = await getSigner(account);
  let mockPaymentLedger = await deployMockContract(signer, paymentLedger.abi);
  await mockPaymentLedger.mock.getPriceFeed.returns(feeService);
  await mockPaymentLedger.mock.getOwnerManager.returns(ownerService);
  await mockPaymentLedger.mock.getLedgerSettings.returns(ledgerSettings);
  await mockPaymentLedger.mock.getContractManager.returns(contractManager);

  return mockPaymentLedger;
}

module.exports = {
  instance,
};
