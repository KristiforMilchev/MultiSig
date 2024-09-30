// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";
import "./../interfaces/IPriceFeed.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../interfaces/IERC20.sol";

contract FeeService is IPriceFeed {
    AggregatorV3Interface internal priceFeed;
    uint256 private feeInUsd;
    address private taxAddress;
    mapping(string => Factory) public factories;

    constructor(
        address _priceFeed,
        address _taxAddress,
        uint256 _feeInUsd,
        address _factory,
        address _networkWrappedToken,
        string memory _defaultFactoryName
    ) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeInUsd = _feeInUsd;
        taxAddress = _taxAddress;
        factories[_defaultFactoryName] = Factory({
            at: _factory,
            wth: _networkWrappedToken
        });
    }

    function getFeeInEthAndUsd()
        external
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue)
    {
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from price feed");

        uint256 priceInUsd = uint256(price);
        uint256 weiPerUsd = (1 * 10 ** 18) / priceInUsd;
        feeInWei = feeInUsd * weiPerUsd;
        feeInUsdValue = feeInUsd * 1e18;
        return (feeInWei, feeInUsdValue);
    }

    function getLatestPrice() external view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getPairAddress(
        address tokenA,
        address tokenB,
        string memory factoryName
    ) public view returns (address pairAddress) {
        return IV2Factory(factories[factoryName].at).getPair(tokenA, tokenB);
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
        (, int ethToUsdPrice, , , ) = priceFeed.latestRoundData();

        require(ethToUsdPrice > 0, "Invalid ETH/USD price");

        uint256 etherAmount = (usdAmount * 1e18) / uint256(ethToUsdPrice);

        return etherAmount;
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
        (, int ethToUsdPrice, , , ) = priceFeed.latestRoundData();

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

    function changeTax(uint256 newFeeInUsd) external onlyOwner returns (bool) {
        feeInUsd = newFeeInUsd;
        return true;
    }

    function withdraw() public onlyOwner {
        payable(taxAddress).transfer(address(this).balance);
    }

    modifier onlyOwner() {
        require(msg.sender == taxAddress, "Not authorized");
        _;
    }
}
