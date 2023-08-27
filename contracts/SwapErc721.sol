//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Swap.sol";
import "hardhat/console.sol";

contract SwapErc721 is Swap {
    event NewSwap(
        bytes32 indexed swapId,
        address indexed sender,
        address indexed receiver,
        address tokenContract,
        uint256 tokenId,
        bytes32 hashlock,
        uint256 timelock);

    struct SwapTransaction {
        address payable sender;
        address payable receiver;
        address tokenContract;
        uint256 tokenId;
        bytes32 hashlock; // hash of preimage
        uint timelock; // unix timestamp seconds
        bool isWithdraw; // the fund is already withdraw or not
        bool isRollback; // check the transaction rollback or not
        bytes32 preimage; // the password compute the hashlock
    }

    mapping (bytes32 => SwapTransaction) swapTransactions;

    function newSwap(address payable _receiver, bytes32 _hashlock, uint _timelock, address _tokenContract, uint256 _tokenId) 
        external
        payable
        verifyErc721TokenTransferable(_tokenContract, _tokenId)
        verifyTimeLockInput(_timelock) 
        returns (bytes32) {
        
        bytes32 swapId = sha256(abi.encodePacked(msg.sender, _receiver, _tokenContract, _tokenId, _hashlock, _timelock));
        if (haveSwap(swapId)) {
            revert("Contract already exists");
        }

        // this contract becomes the owner
        ERC721(_tokenContract).transferFrom(msg.sender, address(this), _tokenId);

        swapTransactions[swapId]= SwapTransaction(
            payable(msg.sender),
            _receiver,
            _tokenContract,
            _tokenId,
            _hashlock,
            _timelock,
            false,
            false,
            0x0
        );

        emit NewSwap(swapId, msg.sender, _receiver, _tokenContract, _tokenId, _hashlock, _timelock);

        return swapId;
    }

    function haveSwap(bytes32 _swapId) internal view override returns (bool) {
        return swapTransactions[_swapId].sender != address(0);
    }

    function withdraw(bytes32 _swapId, bytes32 _preimage) 
        external 
        override
        swapTransactionExists(_swapId)
        hashlockMatches(swapTransactions[_swapId].hashlock, _preimage)
        withdrawable(swapTransactions[_swapId].receiver,
            swapTransactions[_swapId].isWithdraw,
            swapTransactions[_swapId].timelock)
        returns (bool) {
        
        SwapTransaction storage swap = swapTransactions[_swapId];
        swap.preimage = _preimage;
        swap.isWithdraw = true;

        // real transfer money
        ERC721(swap.tokenContract).transferFrom(address(this), swap.receiver, swap.tokenId);
        emit SwapWithdraw(_swapId);
        return true;
    }

    // rollback the transaction
    function rollback(bytes32 _swapId) 
        external override 
        swapTransactionExists(_swapId)
        rollbackable(swapTransactions[_swapId].sender,
            swapTransactions[_swapId].isRollback,
            swapTransactions[_swapId].isWithdraw,
            swapTransactions[_swapId].timelock)
        returns (bool) {
        
        SwapTransaction storage swap = swapTransactions[_swapId];
        swap.isRollback = true;

        // transfer back the money to the sender
        ERC721(swap.tokenContract).transferFrom(address(this), swap.sender, swap.tokenId);
        emit SwapRollback(_swapId);
        return true;
    }

    // get the swap
    function getSwap(bytes32 _swapId) public view
        returns (
            address sender,
            address receiver,
            address tokenContract,
            uint256 tokenId,
            bytes32 hashlock,
            uint timelock,
            bool isWithdraw,
            bool isRollback,
            bytes32 preimage) { 
        
        // not such swap, just return a default empty one
        if (haveSwap(_swapId) == false) {
            return (address(0), address(0), address(0), 0, 0 ,0 , false, false, 0);
        }

        SwapTransaction storage swap = swapTransactions[_swapId];
        return (swap.sender,
            swap.receiver,
            swap.tokenContract,
            swap.tokenId,
            swap.hashlock,
            swap.timelock,
            swap.isWithdraw,
            swap.isRollback,
            swap.preimage);
    }
}