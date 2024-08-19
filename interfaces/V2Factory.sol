// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

//Factory DEX
interface IV2Factory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}
