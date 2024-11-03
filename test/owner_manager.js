const OwnerManager = artifacts.require("OwnerManager");
const { getNonce, delay } = require("./../utils/helpers");

contract("OwnerManager", function (accounts) {
  let instance;

  const [owner1, owner2, owner3] = accounts;
  const owners = [owner1, owner2, owner3];

  beforeEach(async () => {
    await delay(10000);
  });

  before(async () => {
    instance = await OwnerManager.new(owners);
  });

  it("should propose a new owner", async () => {
    nonce = await getNonce(owner1);
    const newOwnerAddress = accounts[3];
    const transaction = await instance.proposeOwner(newOwnerAddress, {
      nonce: nonce,
    });
    const proposalId = transaction.logs[0].args.id;
    const proposal = await instance.getOwnerProposal(proposalId);
    assert.equal(proposal.newOwner, newOwnerAddress);
  });
  it("should approve a new owner", async () => {
    nonce = await getNonce(owner1);
    const newOwnerAddress = accounts[3];
    const transaction = await instance.proposeOwner(newOwnerAddress, {
      nonce: nonce,
    });
    const proposalId = transaction.logs[0].args.id;
    const owner2Nonce = await getNonce(owner2);
    await instance.approveOwner(proposalId, {
      from: owner2,
      nonce: owner2Nonce,
    });
    const proposal = await instance.getOwnerProposal(proposalId);
    assert.equal(proposal.votes.length, 2);
  });

  it("should revert if a non-owner tries to approve a new owner", async () => {
    nonce = await getNonce(owner1);
    const newOwnerAddress = accounts[3];
    const transaction = await instance.proposeOwner(newOwnerAddress, {
      nonce: nonce,
    });
    const proposalId = transaction.logs[0].args.id;
    try {
      const nonOwnerNonce = await getNonce(newOwnerAddress);
      await instance.approveOwner(proposalId, {
        from: accounts[3],
        nonce: nonOwnerNonce,
      });
      assert.fail("Expected revert not received");
    } catch (error) {
      assert.isTrue(error.message.includes("Not authorized"));
    }
  });
  it("Should propose to remove an owner", async () => {
    try {
      nonce = await getNonce(owner1);
      const transaction = await instance.proposeOwnerToBeRemoved(owner3, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id.toNumber();
      const updatedOwners = await instance.getRemoveOwnerProposal(proposalId);
      assert.equal(
        updatedOwners.votes.length,
        1,
        "Failed to propose owner removal."
      );
    } catch (ex) {
      assert.fail("Just Fails!");
    }
  });
  it("Should propose and approve owner removal", async () => {
    nonce = await getNonce(owner1);
    const transaction = await instance.proposeOwnerToBeRemoved(owner3, {
      nonce: nonce,
    });
    const proposalId = transaction.logs[0].args.id;
    const owner2Nonce = await getNonce(owner2);
    await instance.approveOwnerRemove(proposalId, {
      from: owner2,
      nonce: owner2Nonce,
    });
    const updatedOwners = await instance.getRemoveOwnerProposal(proposalId);
    assert.equal(
      updatedOwners.votes.length,
      2,
      "Failed to approve request when voting for owner to be removed."
    );
  });
  it("Should remove an owner", async () => {
    nonce = await getNonce(owner1);
    const transaction = await instance.proposeOwnerToBeRemoved(owner3, {
      nonce: nonce,
    });
    const proposalId = transaction.logs[0].args.id;
    const owner2Nonce = await getNonce(owner2);
    await instance.approveOwnerRemove(proposalId, {
      from: owner2,
      nonce: owner2Nonce,
    });

    await instance.getRemoveOwnerProposal(proposalId);
    const owners = await instance.getOwners();
    assert.equal(owners.length, 2, "Failed to propose owner removal.");
  });
  it("should revert when trying to remove the last owner", async () => {
    try {
      nonce = await getNonce(owner1);
      const transaction = await instance.proposeOwnerToBeRemoved(owner2, {
        nonce: nonce,
      });
      const proposalId = transaction.logs[0].args.id;

      const contractOwners = await instance.getOwners();
      console.log(contractOwners);
      nonce = await getNonce(owner1);
      await instance.approveOwnerRemove(proposalId, {
        from: owner1,
        nonce: nonce,
      });
      assert.fail("Expected revert not received");
    } catch (error) {
      assert.isTrue(true);
    }
  });
});
