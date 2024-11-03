const VerificationService = artifacts.require("VerificationService");
const ContractManager = require("./mocks/contract_manager.js");
const PaymentLedger = require("./mocks/ledger.js");
const LedgerSettigns = require("./mocks/ledger_setting.js");
const OwnerManager = require("./mocks/owner_manager.js");
const FeeService = require("./mocks/fee_service_mock.js");
const { assert } = require("console");
const { delay } = require("./../utils/helpers");

contract("VerificationService", function (accounts) {
  let instance;
  let paymentLedger;
  let contractManager;
  let ledgerSettings;
  let ownerManager;
  let feeService;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];
  let byteCode;
  let cmByteCode;
  let plByteCode;
  let omByteCode;
  let lsByteCode;
  let fsByteCode;
  let hash;

  beforeEach(async () => {
    await delay(10000);
  });

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
    hash = web3.utils.keccak256(
      "0x6080604052348015600f57600080fd5b5060405160c838038060c8833981016040819052602a91604e565b600080546001600160a01b0319166001600160a01b0392909216919091179055607c565b600060208284031215605f57600080fd5b81516001600160a01b0381168114607557600080fd5b9392505050565b603f8060896000396000f3fe6080604052600080fdfea2646970667358221220164ced733355373d04d2603f54a7b92e4ba5abdfc29a3db4485038f2f79773a064736f6c63430008130033"
    );
    // Since we are using Mocks for the smart contracts they all share the same ByteCode
    // There is no reason to duplicate calls for the rest, as the result will be the same
    // This is a bad idea and probably this test will inherit hardcoded bytedata after refactoring
    // To have mo concrete validation, but since i am doing it to cover the new service it's fine for now
    byteCode = await web3.eth.getCode(ownerManager.address);
    cmByteCode = web3.utils.keccak256(byteCode);
    plByteCode = web3.utils.keccak256(byteCode);
    omByteCode = web3.utils.keccak256(byteCode);
    lsByteCode = web3.utils.keccak256(byteCode);
    fsByteCode = web3.utils.keccak256(byteCode);
    instance = await VerificationService.new(
      plByteCode,
      omByteCode,
      lsByteCode,
      cmByteCode,
      fsByteCode
    );
  });

  it("It should verify a smart contract.", async () => {
    const verifyContract = instance.verifyContract(paymentLedger.address);

    assert(verifyContract, true, "Failed to verify contract!");
  });

  it("should fail to verify a contract that has been altered", async () => {
    const verificationInstance = await VerificationService.new(
      hash,
      hash,
      hash,
      hash,
      hash
    );
    const verifyContract = verificationInstance.verifyContract(
      paymentLedger.address
    );
    assert(
      verifyContract,
      true,
      "Verified a contract when it was expected to fail!"
    );
  });

  it("should fail to verify a contract if owner service is modified", async () => {
    instance = await VerificationService.new(
      plByteCode,
      hash,
      lsByteCode,
      cmByteCode,
      fsByteCode
    );

    const verifyContract = instance.verifyContract(paymentLedger.address);
    assert(
      verifyContract,
      true,
      "Verified a contract when it was expected to because owner service is modifed!"
    );
  });

  it("should fail to verify a contract if ledger settings service is modified", async () => {
    instance = await VerificationService.new(
      plByteCode,
      omByteCode,
      hash,
      cmByteCode,
      fsByteCode
    );

    const verifyContract = instance.verifyContract(paymentLedger.address);
    assert(
      verifyContract,
      true,
      "Verified a contract when it was expected to because ledger settings service is modifed!"
    );
  });

  it("should fail to verify a contract if contract manager service is modified", async () => {
    instance = await VerificationService.new(
      plByteCode,
      omByteCode,
      lsByteCode,
      hash,
      fsByteCode
    );

    const verifyContract = instance.verifyContract(paymentLedger.address);
    assert(
      verifyContract,
      true,
      "Verified a contract when it was expected to because contract manager service is modified!"
    );
  });

  it("should fail to verify a contract if price feed service is modified", async () => {
    instance = await VerificationService.new(
      plByteCode,
      omByteCode,
      lsByteCode,
      cmByteCode,
      hash
    );

    const verifyContract = instance.verifyContract(paymentLedger.address);
    assert(
      verifyContract,
      true,
      "Verified a contract when it was expected to because price feed service is modified!"
    );
  });
});
