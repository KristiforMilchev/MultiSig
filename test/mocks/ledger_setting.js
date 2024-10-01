const ledgerSetting = artifacts.require("LedgerSettings");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner, getDeadAddres } = require("./../../utils/helpers");

async function instance(account, owners) {
  let signer = await getSigner(account);
  let mockLedgerSetting = await deployMockContract(signer, ledgerSetting.abi);

  mockLedgerSetting.mock.getSettingProposalById.withArgs(1).returns([
    10, // maxDailyTransactions
    1000, // maxTransactionAmountUSD
    true, // isMaxDailyTransactionsEnabled
    true, // isMaxTransactionAmountEnabled
    [owners[0]], // approvals array
    false, // executed
  ]);

  mockLedgerSetting.mock.getIsMaxTransactionAmountEnabled.returns(true);
  mockLedgerSetting.mock.getIsMaxDailyTransactionEnabled.returns(false);
  mockLedgerSetting.mock.getMaxDailyTransactions.returns(5);
  mockLedgerSetting.mock.getMaxDailyTransactionAmount.returns(500);

  mockLedgerSetting.mock.proposeSettingsChange
    .withArgs(100, 10000, true, true)
    .returns(1);

  mockLedgerSetting.mock.approveSettingsChange.withArgs(1).returns(true);

  return mockLedgerSetting;
}

module.exports = {
  instance,
};
