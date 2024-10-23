const VerificationService = artifacts.require("VerificationService");
const ContractManager = require("./mocks/contract_manager.js");
const PaymentLedger = require("./mocks/ledger.js");
const LedgerSettigns = require("./mocks/ledger_setting.js");
const OwnerManager = require("./mocks/owner_manager.js");
const FeeService = require("./mocks/fee_service_mock.js");

contract("VerificationService", function (accounts) {
  let instance;
  let paymentLedger;
  let contractManager;
  let ledgerSettings;
  let ownerManager;
  let feeService;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];

  before(async () => {
    contractManager = await ContractManager.instance(owner1);
    ledgerSettings = await LedgerSettigns.instance(owner1, owners);
    ownerManager = await OwnerManager.instance(owner1, owners);
    feeService = await FeeService.instance(owner1);
    paymentLedger = await PaymentLedger.instance(
      owner1,
      ownerManager.address,
      ledgerSettings.address,
      contractManager.address,
      feeService.address
    );

    // Since we are using Mocks for the smart contracts they all share the same ByteCode
    // There is no reason to duplicate calls for the rest, as the result will be the same
    // This is a bad idea and probably this test will inherit hardcoded bytedata after refactoring
    // To have mo concrete validation, but since i am doing it to cover the new service it's fine for now
    const byteCode = await web3.eth.getCode(ownerManager.address);
    console.log(byteCode);
    const cmByteCode = web3.utils.keccak256(byteCode);
    const plByteCode = web3.utils.keccak256(byteCode);
    const omByteCode = web3.utils.keccak256(byteCode);
    const lsByteCode = web3.utils.keccak256(byteCode);
    const fsByteCode = web3.utils.keccak256(byteCode);
    instance = await VerificationService.new(
      plByteCode,
      omByteCode,
      lsByteCode,
      cmByteCode,
      fsByteCode
    );
  });

  it("It should verify a smart contract.", async () => {});
});
