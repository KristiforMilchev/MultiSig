// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MultiSig.sol";

interface IFeeService {
    function getFeeInEthAndUsd()
        external
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue);
}

contract DeploymentFactory {
    address private owner;
    address private priceFeed;
    address private netowrkWrappedToken;
    address private factory;
    string private defaultFactoryName;
    IFeeService private feeService;

    constructor(
        address _feeService,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName
    ) {
        owner = msg.sender;
        feeService = IFeeService(_feeService);
        priceFeed = _priceFeed;
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
    }

    function createLedger(
        string memory _name,
        address[] memory _owners
    ) public payable returns (address) {
        (uint256 feeInWei, ) = feeService.getFeeInEthAndUsd();
        require(msg.value >= feeInWei, "Insufficient registration fee");

        MultiSig ms = new MultiSig(
            _name,
            _owners,
            priceFeed,
            netowrkWrappedToken,
            factory,
            defaultFactoryName
        );

        return address(ms);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
}
