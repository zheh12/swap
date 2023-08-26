//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract Swap {
    event SwapWithdraw(bytes32 indexed contractId);
    event SwapRollback(bytes32 indexed contractId);

    modifier verifyFundInput() {
        require(msg.value > 0, "swap value must be > 0");
        _;
    }

    modifier verifyTimeLockInput(uint _time) {
        require(_time > block.timestamp, "timelock time must be after current time");
        _;
    }

    modifier verifyErc721TokenTransferable(address _token, uint256 _tokenId) {
        require(
            ERC721(_token).getApproved(_tokenId) == address(this),
            "Swap must approve spender for the tokenId"
        );
        _;
    }

    modifier verifyErc20TokenTransferable(address _token, address _sender, uint256 _amount) {
        require(_amount > 0, "swap amount must be > 0");
        require(
            ERC20(_token).allowance(_sender, address(this)) >= _amount,
            "token allowance must be >= amount"
        );
        _;
    }

    modifier swapTransactionExists(bytes32 _swapId) {
        require(haveSwap(_swapId), "swap does not exist");
        _;
    }

    modifier hashlockMatches(bytes32 hashlock, bytes32 _preimage) {
        require(
            hashlock == sha256(abi.encodePacked(_preimage)),
            "preimage not match the hashlock"
        );
        _;
    }

    modifier withdrawable(address receiver, bool isWithdraw, uint timelock) {
        require(receiver == msg.sender, "only swap receiver can withdraw");
        require(isWithdraw == false, "only can withdraw once, already withdraw");
        require(timelock > block.timestamp, "timelock time is not right");
        _;
    }

    modifier rollbackable(address sender, bool isRollback, bool isWithdraw, uint timelock) {
        require(sender == msg.sender, "only swap sender can rollback");
        require(isRollback == false, "only can rollback once, already rollbacked");
        require(isWithdraw == false, "the money already withdrawed, so can't rollback");
        require(timelock <= block.timestamp, "timelock not passed, can't rollback, please wait timelock passed");
        _;
    }

    function haveSwap(bytes32 _swapId) internal view virtual returns (bool);

    function withdraw(bytes32 _swapId, bytes32 _preimage) external virtual returns (bool);

    function rollback(bytes32 _swapId) external virtual returns (bool);
}