// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/AggregatorV3.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../structrues/OwnerVote.sol";
import "../structrues/Proposal.sol";
import "../structrues/Transaction.sol";

contract MultiSig {
    address[] private owners;
    mapping(uint256 => Transaction) private transactions;
    Proposal[] private proposals;
    uint256 public nonce;
    event Received(address, uint256);
    uint256 private proposalCounter;
    AggregatorV3Interface internal priceFeed;
    // PKSwap on BSC Testnet
    // Works because the local testnet is clone of the BSC Testnet, might need to find our a different one if you're running against
    // A Different network.
    address factoryAddress = 0x6725F303b657a9451d8BA641348b6761A6CC7a17;
    Factory[] public factories;

    constructor(address[] memory _owners, address _priceFeed) {
        require(_owners.length > 0, "Owners required");
        owners = _owners;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getOwners() public view onlyOwner returns (address[] memory) {
        return owners;
    }

    function proposePayment(
        uint256 amount,
        address to,
        address token
    ) public onlyOwner returns (bool) {
        nonce++;
        Transaction storage newTransaction = transactions[nonce];
        newTransaction.amount = amount;
        newTransaction.to = to;
        newTransaction.state = false;
        newTransaction.token = token;
        newTransaction.approval.push(
            OwnerVote({owner: msg.sender, vote: true})
        );
        return true;
    }

    function getTransactionHistory()
        external
        view
        onlyOwner
        returns (Transaction[] memory)
    {
        uint256 numTransactions = nonce;
        Transaction[] memory transactionList = new Transaction[](
            numTransactions
        );

        for (uint256 i = 0; i < numTransactions; i++) {
            transactionList[i] = transactions[i + 1];
        }

        return transactionList;
    }

    function approvePayment(uint256 _nonce) public onlyOwner returns (bool) {
        Transaction storage newTransaction = transactions[_nonce];

        bool alreadyApproved = false;
        for (uint256 i = 0; i < newTransaction.approval.length; i++) {
            if (newTransaction.approval[i].owner == msg.sender) {
                alreadyApproved = true;
                break;
            }
        }
        require(
            !alreadyApproved,
            "Owner has already approved this transaction"
        );

        newTransaction.approval.push(
            OwnerVote({owner: msg.sender, vote: true})
        );

        bool allApproved = true;
        for (uint256 i = 0; i < owners.length; i++) {
            bool ownerApproved = false;
            for (uint256 j = 0; j < newTransaction.approval.length; j++) {
                if (
                    newTransaction.approval[j].owner == owners[i] &&
                    newTransaction.approval[j].vote
                ) {
                    ownerApproved = true;
                    break;
                }
            }
            if (!ownerApproved) {
                allApproved = false;
                break;
            }
        }

        if (allApproved) {
            if (newTransaction.token == address(0)) {
                _transfer(newTransaction);
            } else {
                _transferERC20(newTransaction);
            }
        }

        return true;
    }

    function proposeOwner(address newOwner) public onlyOwner returns (bool) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == newOwner) {
                revert("Address is already an owner");
            }
        }

        proposalCounter++;

        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalCounter;
        newProposal.newOwner = newOwner;
        newProposal.timestamp = block.timestamp;
        newProposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));

        return true;
    }

    function approveOwner(uint256 proposalId) public onlyOwner returns (bool) {
        bool proposalFound = false;
        uint256 proposalIndex;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].id == proposalId) {
                proposalFound = true;
                proposalIndex = i;
                break;
            }
        }
        require(proposalFound, "Proposal not found");

        Proposal storage proposal = proposals[proposalIndex];

        bool alreadyApproved = false;
        for (uint256 j = 0; j < proposal.votes.length; j++) {
            if (proposal.votes[j].owner == msg.sender) {
                alreadyApproved = true;
                break;
            }
        }
        require(!alreadyApproved, "Owner has already approved this proposal");

        proposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));

        bool allApproved = true;
        for (uint256 k = 0; k < owners.length; k++) {
            bool ownerApproved = false;
            for (uint256 l = 0; l < proposal.votes.length; l++) {
                if (
                    proposal.votes[l].owner == owners[k] &&
                    proposal.votes[l].vote
                ) {
                    ownerApproved = true;
                    break;
                }
            }
            if (!ownerApproved) {
                allApproved = false;
                break;
            }
        }

        if (allApproved) {
            proposals[proposalIndex] = proposals[proposals.length - 1];
            proposals.pop();

            owners.push(proposal.newOwner);

            return true;
        }

        return false;
    }

    function getLatestPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getPairForTokens(
        address tokenA,
        address tokenB
    ) public view returns (address) {
        IV2Factory factory = IV2Factory(factoryAddress);
        return factory.getPair(tokenA, tokenB);
    }

    function convertUsdToTokenWei(
        address token,
        address stablecoin,
        uint256 usdAmount
    ) public view returns (uint256) {
        address pairAddress = getPairForTokens(token, stablecoin);
        require(pairAddress != address(0), "Pair not found");

        ITokenPairV2 pair = ITokenPairV2(pairAddress);
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();

        (uint112 tokenReserve, uint112 stablecoinReserve) = pair.token0() ==
            token
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        uint256 tokenPriceInUsd = (uint256(stablecoinReserve) * 1e18) /
            uint256(tokenReserve);

        uint256 tokenAmountInWei = (usdAmount * 1e18) / tokenPriceInUsd;

        return tokenAmountInWei;
    }

    function convertUsdToWei(uint256 usdAmount) public view returns (uint256) {
        int256 ethToUsdPrice = getLatestPrice();
        require(ethToUsdPrice > 0, "Invalid ETH/USD price");

        uint256 etherAmount = (usdAmount * 1e18) / uint256(ethToUsdPrice);

        return etherAmount;
    }

    function getBalanceInUSD() public view returns (uint256) {
        uint256 balanceInWei = address(this).balance;
        int256 ethToUsdPrice = getLatestPrice();
        require(ethToUsdPrice > 0, "Invalid ETH/USD price");

        uint256 balanceInUSD = (balanceInWei * uint256(ethToUsdPrice)) / 1e18;

        return balanceInUSD;
    }

    function _transfer(Transaction storage process) internal returns (bool) {
        (bool success, ) = process.to.call{value: process.amount}("");
        require(success, "Transfer failed");
        process.state = true;

        return true;
    }

    function _transferERC20(
        Transaction storage process
    ) internal returns (bool) {
        IERC20 tokenContract = IERC20(process.token);
        require(
            tokenContract.transfer(process.to, process.amount),
            "ERC20 transfer failed"
        );
        process.state = true;

        return true;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    modifier onlyOwner() {
        bool isOwner = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not authorized");
        _;
    }
}
