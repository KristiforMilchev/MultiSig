const VerificationService = artifacts.require("VerificationService");
const OwnerManager = artifacts.require("OwnerManager");
const LedgerSettings = artifacts.require("LedgerSettings");
const ContractService = artifacts.require("ContractService");
const PaymentLedger = artifacts.require("PaymentLedger");
const FeeService = artifacts.require("FeeService");

module.exports = async function (deployer) {
  const paymentLedgerRuntimeBytecode = PaymentLedger.deployedBytecode;
  const ownerManagerRuntimeBytecode = OwnerManager.deployedBytecode;
  const ledgerSettingsRuntimeBytecode = LedgerSettings.deployedBytecode;
  const contractServiceRuntimeBytecode = ContractService.deployedBytecode;
  const feeServiceRuntimeBytecode = FeeService.deployedBytecode;

  // Hash the trimmed bytecode
  const paymentLedgerBytecodeHash = web3.utils.keccak256(
    paymentLedgerRuntimeBytecode
  );
  const ownerManagerBytecodeHash = web3.utils.keccak256(
    ownerManagerRuntimeBytecode
  );
  const ledgerSettingsBytecodeHash = web3.utils.keccak256(
    ledgerSettingsRuntimeBytecode
  );
  const contractServiceBytecodeHash = web3.utils.keccak256(
    contractServiceRuntimeBytecode
  );
  const feeServiceBytecodeHash = web3.utils.keccak256(
    feeServiceRuntimeBytecode
  );

  console.log(paymentLedgerBytecodeHash);
  console.log(ownerManagerBytecodeHash);
  console.log(ledgerSettingsBytecodeHash);
  console.log(contractServiceBytecodeHash);
  console.log(feeServiceBytecodeHash);

  // Deploy the VerificationService with the pre-calculated hashes
  await deployer.deploy(
    VerificationService,
    paymentLedgerBytecodeHash,
    ownerManagerBytecodeHash,
    ledgerSettingsBytecodeHash,
    contractServiceBytecodeHash,
    feeServiceBytecodeHash
  );
};
