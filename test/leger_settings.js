const LedgerSettings = artifacts.require("LedgerSettings");
const { getNonce } = require("./../utils/helpers");
const { ethers } = require("ethers");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const ownerContract = artifacts.require("OwnerManager");
contract("LedgerSettings", function (accounts) {
  let settingsInstance;
  let mockContract;
  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];

  before(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(web3.currentProvider);
      // Get the first account as a signer
      const signer = provider.getSigner(accounts[0]);
      mockContract = await deployMockContract(signer, ownerContract.abi);
      console.log(mockContract);

      // Mock the return value for getOwners function
      await mockContract.mock.getOwners.returns(owners);

      // Deploy the LedgerSettings contract with the mock address
      settingsInstance = await LedgerSettings.new(
        mockContract.address,
        true,
        5,
        true,
        10000
      );
    } catch (ex) {
      console.log(ex);
    }
  });

  describe("Settings Proposal", () => {
    it("should propose a settings change", async () => {
      const nonce = await getNonce(owner1);
      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );

      const proposalId = transaction.logs[0].args.id;
      const settingsProposal = await settingsInstance.getSettingProposalById(
        proposalId
      );
      assert.equal(settingsProposal.maxDailyTransactions.toString(), "10");
      assert.equal(settingsProposal.maxTransactionAmountUSD.toString(), "5000");
    });

    it("should approve settings change", async () => {
      const nonce = await getNonce(owner1);
      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );
      const proposalId = transaction.logs[0].args.id;

      const nonceOwner2 = await getNonce(owner2);
      await settingsInstance.approveSettingsChange(proposalId, {
        from: owner2,
        nonce: nonceOwner2,
      });
      const settingsProposal = await settingsInstance.getSettingProposalById(
        proposalId
      );
      assert.equal(
        settingsProposal.approvals.length,
        2,
        "Expected proposal approvals to be 2, got 1"
      );
    });

    it("should revert when trying to approve an already executed proposal", async () => {
      const nonce = await getNonce(owner1);
      const transaction = await settingsInstance.proposeSettingsChange(
        10,
        5000,
        true,
        false,
        {
          nonce: nonce,
        }
      );
      const proposalId = transaction.logs[0].args.id;
      const owner2Nonce = await getNonce(owner2);
      const owner3Nonce = await getNonce(owner3);
      await settingsInstance.approveSettingsChange(proposalId, {
        from: owner2,
        nonce: owner2Nonce,
      });

      try {
        await settingsInstance.approveSettingsChange(proposalId, {
          from: owner3,
          nonce: owner3Nonce,
        });
        await settingsInstance.getSettingProposalById(proposalId);
        const owner1Nonce = await getNonce(owner1);

        await settingsInstance.approveSettingsChange(proposalId, {
          from: owner1,
          nonce: owner1Nonce,
        });
        assert.fail("Expected revert not received");
      } catch (error) {
        assert.isTrue(error.message.includes("Proposal already executed"));
      }
    });
  });
});
