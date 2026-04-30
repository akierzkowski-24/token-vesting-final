// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// openzeppelin contract for erc20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// just a simple token to test vesting
contract VestingToken is ERC20 {

    // constructor to mint tokens to the person who deploys
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    )
        ERC20(name, symbol)
    {
        // mint the tokens to the owner
        _mint(msg.sender, supply);
    }
}
