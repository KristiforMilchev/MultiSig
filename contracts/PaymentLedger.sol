// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/AggregatorV3.sol";
import "../interfaces/IOwnerManager.sol";
import "../interfaces/ILedgerSettings.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IERC721.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../structrues/OwnerVote.sol";
import "../structrues/Proposal.sol";
import "../structrues/Transaction.sol";
import "../structrues/SettingProposal.sol";
import "../structrues/SmartContractToken.sol";
import "../structrues/transaction_setting.sol";

contract PaymentLedger {
    mapping(uint256 => Transaction) private transactions;
    mapping(uint256 => Transaction) private nftTransactions;
    mapping(uint256 => SettingsProposal) public settingsProposals;
    IOwnerManger private ownerManager;
    ILedgerSettings private ledgerSettings;

    SmartContractToken[] private whitelistedERC20;
    address[] private whitelistedERC721;

    uint256 public nonce;
    uint256 public nftNonce;
    event Received(address, uint256);
    uint256 private proposalCounter = 0;
    AggregatorV3Interface internal priceFeed;
    mapping(string => Factory) public factories;
    string private name;
    mapping(uint256 => uint256) private dailyTransactionCount;
    uint256 private lastTransactionDay;

    constructor(
        string memory _name,
        address _ownerManger,
        address _ledgerSettings,
        SmartContractToken[] memory _whitelistedERC20,
        address[] memory _whitelistedERC721,
        address _priceFeed,
        address _factory,
        address _networkWrappedToken,
        string memory _defaultFactoryName
    ) {
        name = _name;
        ownerManager = IOwnerManger(_ownerManger);
        ledgerSettings = ILedgerSettings(_ledgerSettings);
        initializeDefaultTokens(_whitelistedERC20, _whitelistedERC721);
        initializePriceFeed(_priceFeed);
        initializeDefaultFactory(
            _factory,
            _networkWrappedToken,
            _defaultFactoryName
        );
    }

    function initializeDefaultTokens(
        SmartContractToken[] memory _whitelistedERC20,
        address[] memory _whitelistedERC721
    ) internal returns (bool) {
        for (uint256 i = 0; i < _whitelistedERC20.length; i++) {
            SmartContractToken memory token = _whitelistedERC20[i];
            whitelistedERC20.push(token);
        }

        for (uint256 i = 0; i < _whitelistedERC721.length; i++) {
            whitelistedERC721.push(_whitelistedERC721[i]);
        }
        return true;
    }

    function initializePriceFeed(address _priceFeed) internal returns (bool) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        return true;
    }

    function initializeDefaultFactory(
        address _factory,
        address _networkWrappedToken,
        string memory _defaultFactoryName
    ) internal returns (bool) {
        factories[_defaultFactoryName] = Factory({
            at: _factory,
            wth: _networkWrappedToken
        });
        return true;
    }

    function getOwnerManager() external view onlyOwner returns (IOwnerManger) {
        return ownerManager;
    }

    function getLedgerSettings()
        external
        view
        onlyOwner
        returns (ILedgerSettings)
    {
        return ledgerSettings;
    }

    function getName() external view onlyOwner returns (string memory) {
        return name;
    }

    function getERC20()
        external
        view
        onlyOwner
        returns (SmartContractToken[] memory)
    {
        return whitelistedERC20;
    }

    function addWhitelistedERC20(
        address tokenAddress,
        int decimals
    ) public onlyOwner returns (bool) {
        require(!isTokenWhitelisted(tokenAddress), "Token already whitelisted");
        SmartContractToken memory newToken = SmartContractToken({
            contractAddress: tokenAddress,
            decimals: decimals
        });

        whitelistedERC20.push(newToken);

        return true;
    }

    function isTokenWhitelisted(
        address tokenAddress
    ) internal view returns (bool) {
        for (uint256 i = 0; i < whitelistedERC20.length; i++) {
            if (whitelistedERC20[i].contractAddress == tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function getERC721() external view onlyOwner returns (address[] memory) {
        return whitelistedERC721;
    }

    function addWhitelistedERC721(
        address tokenAddress
    ) public onlyOwner returns (bool) {
        require(
            !isERC721TokenWhitelisted(tokenAddress),
            "Token already whitelisted"
        );

        whitelistedERC721.push(tokenAddress);

        return true;
    }

    function isERC721TokenWhitelisted(
        address tokenAddress
    ) internal view returns (bool) {
        for (uint256 i = 0; i < whitelistedERC721.length; i++) {
            if (whitelistedERC721[i] == tokenAddress) {
                return true;
            }
        }
        return false;
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

    function getTransactionById(
        uint256 transactionId
    ) public view onlyOwner returns (Transaction memory) {
        return transactions[transactionId];
    }

    function getNftTransactionById(
        uint256 nftTransactionId
    ) public view onlyOwner returns (Transaction memory) {
        return nftTransactions[nftTransactionId];
    }

    function getPairForTokens(
        address tokenA,
        string memory _name
    ) public view returns (address) {
        Factory storage currentFactory = factories[_name];
        IV2Factory factory = IV2Factory(currentFactory.at);
        return factory.getPair(tokenA, currentFactory.wth);
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

    function getLatestPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getBalanceInUSD() public view returns (uint256) {
        uint256 balanceInWei = address(this).balance;
        int256 ethToUsdPrice = getLatestPrice();
        require(ethToUsdPrice > 0, "Invalid ETH/USD price");

        uint256 balanceInUSD = (balanceInWei * uint256(ethToUsdPrice)) / 1e18;

        return balanceInUSD;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getPairAddress(
        address tokenA,
        address tokenB,
        string memory factoryName
    ) public view returns (address pairAddress) {
        return IV2Factory(factories[factoryName].at).getPair(tokenA, tokenB);
    }

    function convertUsdToTokenWei(
        address token,
        uint256 usdAmount,
        string memory factory
    ) public view returns (uint256) {
        address pairAddress = getPairForTokens(token, factory);
        require(pairAddress != address(0), "Pair not found");

        ITokenPairV2 pair = ITokenPairV2(pairAddress);
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

    function convertWeiToUsd(
        uint256 amountInWei
    ) public view returns (uint256) {
        int256 ethToUsdPrice = getLatestPrice();
        require(ethToUsdPrice > 0, "Invalid ETH/USD price");
        return (amountInWei * uint256(ethToUsdPrice)) / 1e18;
    }

    function convertTokenToUsd(
        address token,
        uint256 amount,
        string memory factory
    ) public view returns (uint256) {
        address pairAddress = getPairForTokens(token, factory);
        require(pairAddress != address(0), "Pair not found");

        ITokenPairV2 pair = ITokenPairV2(pairAddress);
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

        return (amount * tokenPriceInUsd) / 10 ** tokenDecimals;
    }

    function proposePayment(
        uint256 amount,
        address to,
        address token
    )
        public
        onlyOwner
        withinDailyLimit
        withinTransactionAmountLimit(amount)
        returns (bool)
    {
        if (ledgerSettings.getIsMaxTransactionAmountEnabled()) {
            require(
                ledgerSettings.getMaxDailyTransactionAmount() > amount,
                "Transaction amount exceeds max allowed limit!"
            );
        }
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

    function approvePayment(uint256 _nonce) public onlyOwner returns (bool) {
        require(!isTransactionEmpty(_nonce), "Transaction not found");

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
        address[] memory owners = ownerManager.getOwners();

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

    function proposeNftTransfer(
        address nftContract,
        address to,
        uint256 tokenId
    ) public onlyOwner withinDailyLimit returns (bool) {
        nftNonce++;
        Transaction storage newTransaction = nftTransactions[nftNonce];
        newTransaction.amount = tokenId;
        newTransaction.to = to;
        newTransaction.state = false;
        newTransaction.token = nftContract;
        newTransaction.approval.push(
            OwnerVote({owner: msg.sender, vote: true})
        );
        return true;
    }

    function approveNftTransfer(
        uint256 _nonce
    ) public onlyOwner returns (bool) {
        Transaction storage newTransaction = nftTransactions[_nonce];

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
        address[] memory owners = ownerManager.getOwners();

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
        bool result = false;
        if (allApproved) {
            result = _transferNFT(
                newTransaction.token,
                newTransaction.to,
                newTransaction.amount
            );
        }

        return result;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }

    function _transfer(Transaction storage t) internal {
        require(address(this).balance >= t.amount, "Insufficient balance");

        if (ledgerSettings.getIsMaxTransactionAmountEnabled()) {
            uint256 amountInUsd = convertWeiToUsd(t.amount);

            require(
                amountInUsd <= ledgerSettings.getMaxDailyTransactionAmount(),
                "Transaction amount exceeds max allowed USD limit"
            );
        }

        (bool sent, ) = t.to.call{value: t.amount}("");
        require(sent, "Failed to send Ether");

        t.state = true;
    }

    function isTransactionEmpty(uint256 _nonce) internal view returns (bool) {
        Transaction storage txn = transactions[_nonce];
        return
            txn.amount == 0 &&
            txn.to == address(0) &&
            txn.hash == bytes32(0) &&
            txn.approval.length == 0 &&
            txn.state == false &&
            txn.token == address(0);
    }

    function _transferERC20(Transaction storage t) internal {
        require(t.token != address(0), "Invalid token address");
        IERC20 token = IERC20(t.token);

        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance >= t.amount, "Insufficient token balance");

        if (ledgerSettings.getIsMaxTransactionAmountEnabled()) {
            uint256 amountInUsd = convertTokenToUsd(
                t.token,
                t.amount,
                "defaultFactory"
            );

            require(
                amountInUsd <= ledgerSettings.getMaxDailyTransactionAmount(),
                "Transaction amount exceeds max allowed USD limit"
            );
        }

        require(token.transfer(t.to, t.amount), "Token transfer failed");

        t.state = true;
    }

    function _transferNFT(
        address nftContract,
        address to,
        uint256 tokenId
    ) internal withinDailyLimit returns (bool) {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == address(this), "Not the NFT owner");

        nft.safeTransferFrom(address(this), to, tokenId);

        return true;
    }

    modifier onlyOwner() {
        bool isOwner = false;
        address[] memory owners = ownerManager.getOwners();
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not authorized");
        _;
    }

    modifier withinDailyLimit() {
        if (ledgerSettings.getIsMaxDailyTransactionEnabled()) {
            uint256 currentDay = block.timestamp / 1 days;

            if (lastTransactionDay != currentDay) {
                dailyTransactionCount[currentDay] = 0;
                lastTransactionDay = currentDay;
            }

            require(
                dailyTransactionCount[currentDay] <
                    ledgerSettings.getMaxDailyTransactions(),
                "Max daily transaction limit reached"
            );

            dailyTransactionCount[currentDay]++;
        }
        _;
    }

    modifier withinTransactionAmountLimit(uint256 amountInUSD) {
        if (ledgerSettings.getIsMaxTransactionAmountEnabled()) {
            require(
                amountInUSD <= ledgerSettings.getMaxDailyTransactionAmount(),
                "Transaction exceeds max amount limit"
            );
        }
        _;
    }
}
