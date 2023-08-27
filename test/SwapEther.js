const { expect, assert } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const { ethers } = hre;

describe("Swap contract", function() {

    async function deploySwapFixture() {
        // Get the ContractFactory and Signers here.
        const Swap = await ethers.getContractFactory("SwapEther");
        const [owner, addr1, addr2] = await ethers.getSigners();
    
        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens onces its transaction has been
        // mined.
        const swapContract = await Swap.deploy();
    
        await swapContract.deployed();
    
        // Fixtures can return anything you consider useful for your tests
        return { Swap, swapContract, owner, addr1, addr2 };
    }

    it ('Swap contract can deployed', async() => {
        await loadFixture(deploySwapFixture);
    })

    it ('newSwap() create new swap transaction', async () => {
        const { swapContract, owner, addr1 } = await loadFixture(deploySwapFixture)
        let timelock = Math.floor(Date.now() / 1000) + 60 * 60;

        const tx = await swapContract.newSwap(addr1.address,
            ethers.utils.sha256(ethers.utils.toUtf8Bytes("hello")),
            timelock, {value: 1000000000000000});
        
        const receipt = await tx.wait();

        const args = receipt.events[0].args;

        const swapId = args[0]
        
        assert.equal(args.sender, owner.address)
        assert.equal(args.receiver, addr1.address)
        assert.equal(args.amount, 1000000000000000)
        assert.equal(args.timelock, timelock)

        // check get contract right
        const swap = await swapContract.getSwap(swapId);
        assert.equal(swap.sender, owner.address);
        assert.equal(swap.receiver, addr1.address);
        assert.equal(swap.amount, 1000000000000000);
        assert.equal(swap.timelock, timelock);
        assert.equal(swap.isWithdraw, false);
        assert.equal(swap.isRollback, false);
        assert.equal(swap.preimage, "0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("withdraw() should success when given correct preimage", async () => {
        const { swapContract, owner, addr1 } = await loadFixture(deploySwapFixture)
        let timelock = Math.floor(Date.now() / 1000) + 60 * 60;
        const preimage = ethers.utils.formatBytes32String("hello");
        const hashlock = ethers.utils.sha256(preimage);

        console.log("preimage", preimage)
        console.log("hashlock", hashlock)
        console.log("timelock", timelock)

        const tx = await swapContract.newSwap(addr1.address, hashlock,
            timelock, {value: 1000000000000000});

        const receipt = await tx.wait();
        const args = receipt.events[0].args;
        const swapId = args[0]
        const beforeTransferBalance = await addr1.getBalance();
        console.log(beforeTransferBalance);

        // do withdraw
        const withdrawTx = await swapContract.connect(addr1).withdraw(swapId, preimage)
        const withdrawReceipt = await withdrawTx.wait();

        const gasFee = ethers.BigNumber.from(withdrawReceipt.gasUsed * withdrawReceipt.effectiveGasPrice);

        console.log(gasFee)
        
        const afterTransferBalance = await addr1.getBalance();
        console.log(afterTransferBalance);

        assert.isTrue(
            beforeTransferBalance.add(ethers.BigNumber.from(1000000000000000))
            .sub(gasFee).eq(afterTransferBalance));

        // check get contract right
        const swap = await swapContract.getSwap(swapId);
        assert.equal(swap.sender, owner.address);
        assert.equal(swap.receiver, addr1.address);
        assert.equal(swap.amount, 1000000000000000);
        assert.equal(swap.timelock, timelock);
        assert.equal(swap.isWithdraw, true);
        assert.equal(swap.isRollback, false);
        assert.equal(swap.preimage, "0x68656c6c6f000000000000000000000000000000000000000000000000000000");
    })

    it("rollback() should rollback with expired locktime", async () => {
        const { swapContract, owner, addr1 } = await loadFixture(deploySwapFixture)
        let timelock = Math.floor(Date.now() / 1000) + 2;
        const preimage = ethers.utils.formatBytes32String("hello");
        const hashlock = ethers.utils.sha256(preimage);

        const tx = await swapContract.newSwap(addr1.address, hashlock,
            timelock, {value: 1000000000000000});

        const receipt = await tx.wait();
        const args = receipt.events[0].args;
        const swapId = args[0]
        
        return new Promise((resolve, reject) => 
            setTimeout(async () => {
                try {
                    console.log("start rollback");
                    const beforeBalance = await owner.getBalance();
                    const rollbackTx = await swapContract.rollback(swapId);
                    const receipt = await rollbackTx.wait();
                    const afterBalance = await owner.getBalance();
                    const gasFee = ethers.BigNumber.from(receipt.gasUsed * receipt.effectiveGasPrice);

                    assert.isTrue(
                        beforeBalance.add(ethers.BigNumber.from(1000000000000000))
                        .sub(gasFee).eq(afterBalance));
            
                    const swap = await swapContract.getSwap(swapId);
      
                    assert.equal(swap.isWithdraw, false);
                    assert.equal(swap.isRollback, true);

                    console.log("end process")
                    resolve();
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }
            }, 2000));
    });
});