// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// using openzeppelin for owner and safe token transfers
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    // the token we are giving out
    IERC20 public token;

    // this stores all the vesting info
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 start;
        uint256 cliffDuration;
        uint256 duration;
        uint256 released;
        bool revocable;
        bool revoked;
        uint256 vestedAtRevoke;
    }

    VestingSchedule public schedule;
    bool public initialized;

    // basic events
    event VestingCreated(
        address beneficiary, 
        uint256 amount, 
        uint256 start, 
        uint256 cliff, 
        uint256 duration, 
        bool revocable
    );
    event TokensReleased(address beneficiary, uint256 amount);
    event VestingRevoked(uint256 unvestedAmount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        require(tokenAddress != address(0), "need a real token address");
        token = IERC20(tokenAddress);
    }

    // setup the vesting schedule
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 start,
        uint256 cliff,
        uint256 duration,
        bool revocable
    ) external onlyOwner {
        require(!initialized, "already done");
        require(beneficiary != address(0), "bad beneficiary");
        require(amount > 0, "amount too low");
        require(duration > 0, "duration too low");
        require(cliff <= duration, "cliff longer than duration");

        // get tokens from the owner
        token.safeTransferFrom(msg.sender, address(this), amount);

        schedule = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: amount,
            start: start,
            cliffDuration: cliff,
            duration: duration,
            released: 0,
            revocable: revocable,
            revoked: false,
            vestedAtRevoke: 0
        });

        initialized = true;
        emit VestingCreated(beneficiary, amount, start, cliff, duration, revocable);
    }

    // stop the vesting if allowed
    function revoke() external onlyOwner {
        require(initialized, "no schedule");
        require(schedule.revocable, "cant revoke this");
        require(!schedule.revoked, "already revoked");

        uint256 vested = _vestedAmount();
        uint256 unvested = schedule.totalAmount - vested;

        schedule.revoked = true;
        schedule.vestedAtRevoke = vested;

        if (unvested > 0) {
            token.safeTransfer(owner(), unvested);
        }

        emit VestingRevoked(unvested);
    }

    // the beneficiary calls this to get their tokens
    function release() external {
        require(initialized, "not setup");
        require(msg.sender == schedule.beneficiary, "not yours");

        // check if cliff is over
        uint256 cliffTime = schedule.start + schedule.cliffDuration;
        require(block.timestamp >= cliffTime, "cliff not over");

        uint256 amount = _releasableAmount();
        require(amount > 0, "nothing to claim");

        schedule.released = schedule.released + amount;
        token.safeTransfer(schedule.beneficiary, amount);

        emit TokensReleased(schedule.beneficiary, amount);
    }

    // how many tokens can be taken now
    function releasableAmount() external view returns (uint256) {
        return _releasableAmount();
    }

    // internal math for releasable
    function _releasableAmount() private view returns (uint256) {
        return _vestedAmount() - schedule.released;
    }

    // internal math for total vested
    function _vestedAmount() private view returns (uint256) {
        if (schedule.revoked) {
            return schedule.vestedAtRevoke;
        }

        if (block.timestamp < schedule.start) {
            return 0;
        }

        uint256 timePassed = block.timestamp - schedule.start;

        if (timePassed >= schedule.duration) {
            return schedule.totalAmount;
        }

        // linear math
        return (schedule.totalAmount * timePassed) / schedule.duration;
    }
}
