const ownerManager = artifacts.require("OwnerManager");
const { deployMockContract } = require("@ethereum-waffle/mock-contract");
const { getSigner } = require("./../../utils/helpers");

async function instance(account, owners) {
  let newOwnerAddress = "0x700A97b62E390e82753bCE29db09903E708E122d";
  let signer = await getSigner(account);
  let mockOwnerManager = await deployMockContract(signer, ownerManager.abi);

  await mockOwnerManager.mock.getOwners.returns(owners);
  if (owners.length === 0) return mockOwnerManager;

  await mockOwnerManager.mock.proposeOwner
    .withArgs(newOwnerAddress)
    .returns(true);

  await mockOwnerManager.mock.proposeOwner
    .withArgs(owners[1])
    .revertsWithReason("Address is already an owner");

  await mockOwnerManager.mock.getOwnerProposal.withArgs(1).returns({
    id: 1,
    newOwner: "0x1234567890123456789012345678901234567890",
    timestamp: Math.floor(Date.now() / 1000),
    votes: [[owners[1], true]],
  });

  await mockOwnerManager.mock.approveOwner.withArgs(1).returns(true);
  await mockOwnerManager.mock.getRemoveOwnerProposal.withArgs(1).returns({
    id: 1,
    newOwner: "0x1234567890123456789012345678901234567890",
    timestamp: Math.floor(Date.now() / 1000),
    votes: [[owners[1], true]],
  });

  await mockOwnerManager.mock.getRemoveOwnerProposals.returns([
    {
      id: 1,
      newOwner: "0x1234567890123456789012345678901234567890",
      timestamp: Math.floor(Date.now() / 1000),
      votes: [[owners[1], true]],
    },
  ]);

  await mockOwnerManager.mock.proposeOwnerToBeRemoved
    .withArgs(newOwnerAddress)
    .returns(true);
  await mockOwnerManager.mock.approveOwnerRemove.withArgs(1).returns(true);

  return mockOwnerManager;
}

module.exports = {
  instance,
};
