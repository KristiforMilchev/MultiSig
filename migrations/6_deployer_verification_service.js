const VerificationService = artifacts.require("VerificationService");
const OwnerManager = artifacts.require("OwnerManager");
const LedgerSettings = artifacts.require("LedgerSettings");
const ContractService = artifacts.require("ContractService");
const PaymentLedger = artifacts.require("PaymentLedger");
const FeeService = artifacts.require("FeeService");

module.exports = async function (deployer) {
  const ownerManagerBytecode = OwnerManager.bytecode;
  const ledgerSettingsBytecode = LedgerSettings.bytecode;
  const contractServiceBytecode = ContractService.bytecode;
  const paymentLedgerBytecode = PaymentLedger.bytecode;
  const feeServiceBytecode = FeeService.bytecode;

  //calculate bytehash for each contract module
  const paymentLedgerBytecodeHash = web3.utils.keccak256(paymentLedgerBytecode);
  const ownerManagerBytecodeHash = web3.utils.keccak256(ownerManagerBytecode);
  const ledgerSettingsBytecodeHash = web3.utils.keccak256(
    ledgerSettingsBytecode
  );
  const contractServiceBytecodeHash = web3.utils.keccak256(
    contractServiceBytecode
  );
  const feeServiceBytecodeHash = web3.utils.keccak256(feeServiceBytecode);

  //Deploying a verification service
  await deployer.deploy(
    VerificationService,
    paymentLedgerBytecodeHash,
    ownerManagerBytecodeHash,
    ledgerSettingsBytecodeHash,
    contractServiceBytecodeHash,
    feeServiceBytecodeHash
  );
};
