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
    mapping(string => Factory) public factories;

    constructor(
        address[] memory _owners,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName
    ) {
        require(_owners.length > 0, "Owners required");
        owners = _owners;
        priceFeed = AggregatorV3Interface(_priceFeed);
        factories[_defaultFactoryName] = Factory({
            at: _factory,
            wth: _netowrkWrappedToken
        });
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

    function addFactory(
        string memory name,
        address factoryAddress,
        address baseFactoryCurrency
    ) public payable returns (bool) {
        require(
            factories[name].at != address(0),
            "Factory with that name already exists!"
        );

        factories[name] = Factory({
            at: factoryAddress,
            wth: baseFactoryCurrency
        });

        return true;
    }

    function getLatestPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getPairForTokens(
        address tokenA,
        string memory name
    ) public view returns (address) {
        Factory storage currentFactory = factories[name];
        IV2Factory factory = IV2Factory(currentFactory.at);
        return factory.getPair(tokenA, currentFactory.wth);
    }

    function convertUsdToTokenWei(
        address token,
        uint256 usdAmount,
        string memory factory
    ) public view returns (uint256) {
        address pairAddress = getPairForTokens(token, factory);
        require(pairAddress != address(0), "Pair not found");

        ITokenPairV2 pair = ITokenPairV2(pairAddress);
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();

        (address tokenReserve, address stablecoinReserve) = getTokenReserves(
            pair,
            token
        );

        (
            uint112 tokenReserveAmount,
            uint112 stablecoinReserveAmount
        ) = getReserveAmounts(pair, tokenReserve);

        uint8 tokenDecimals = IERC20(tokenReserve).decimals();
        uint8 stablecoinDecimals = IERC20(stablecoinReserve).decimals();

        uint256 tokenPriceInUsd = calculatePriceInUsd(
            tokenReserveAmount,
            stablecoinReserveAmount,
            tokenDecimals,
            stablecoinDecimals
        );

        uint256 tokenAmountInWei = calculateTokenAmount(
            usdAmount,
            tokenPriceInUsd,
            tokenDecimals
        );

        return tokenAmountInWei;
    }

    function getTokenReserves(
        ITokenPairV2 pair,
        address token
    ) internal view returns (address tokenReserve, address stablecoinReserve) {
        address token0 = pair.token0();
        address token1 = pair.token1();

        return (token0 == token) ? (token0, token1) : (token1, token0);
    }

    function getReserveAmounts(
        ITokenPairV2 pair,
        address tokenReserve
    )
        internal
        view
        returns (uint112 tokenReserveAmount, uint112 stablecoinReserveAmount)
    {
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();
        address token0 = pair.token0();

        return
            (tokenReserve == token0)
                ? (reserve0, reserve1)
                : (reserve1, reserve0);
    }

    function calculatePriceInUsd(
        uint112 tokenReserveAmount,
        uint112 stablecoinReserveAmount,
        uint8 tokenDecimals,
        uint8 stablecoinDecimals
    ) internal pure returns (uint256) {
        uint256 tokenReserveNormalized = uint256(tokenReserveAmount) *
            10 ** uint256(stablecoinDecimals);
        uint256 stablecoinReserveNormalized = uint256(stablecoinReserveAmount) *
            10 ** uint256(tokenDecimals);

        return (stablecoinReserveNormalized * 1e18) / tokenReserveNormalized;
    }

    function calculateTokenAmount(
        uint256 usdAmount,
        uint256 tokenPriceInUsd,
        uint8 tokenDecimals
    ) internal pure returns (uint256) {
        return
            (usdAmount * 10 ** uint256(tokenDecimals) * 1e18) / tokenPriceInUsd;
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
