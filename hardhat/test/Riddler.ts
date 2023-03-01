import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("Riddler", function () {

    async function deployRiddlerContract() {
        const riddlerFactory = await ethers.getContractFactory("Riddler");
        const riddler = await riddlerFactory.deploy();
        return riddler;
    }

    it("requires minimum deposit or else it reverts to guess", async function () {
        const riddler = await deployRiddlerContract();
        await riddler.createRiddle("crane", "juice");
        await expect(riddler.guess(0, "juice")).to.be.revertedWith("wrong deposit amount");
    });

    it("only the owner should be able to create a riddle", async function () {
        const riddler = await deployRiddlerContract();
        const signers = await ethers.getSigners();
        const notOwner = signers[1];

        await expect(
            riddler.connect(notOwner).createRiddle("crane ", "juice")
        ).to.be.revertedWith("only owner can do this");
    });


    it("should be able to create a riddle, and then get that riddle", async function () {
        // deploy our Riddler contract
        const riddler = await deployRiddlerContract();
        await riddler.createRiddle("crane", "juice");

        const riddles = await riddler.getriddles();
        expect(riddles.length).to.be.eq(1);
        expect(riddles[0].question).to.be.eq("crane");

        const wantPacked = ethers.utils.solidityPack(['string'], ['juice']);
        const wantHash = ethers.utils.solidityKeccak256(["bytes"], [wantPacked])

        expect(riddles[0].answer).to.be.eq(wantHash)
    });

    it("should be able to tell whether the guess is correct", async function () {
        const riddler = await deployRiddlerContract();
        const minAmount = await riddler.getMinDepositAmount();

        await riddler.createRiddle("crane", "juice");

        await expect(riddler.guess(0, "juice", {
            value: minAmount,
        })).to.emit(riddler, "RiddleSolved");

    });


    it("should be able to tell whether the guess is not correct", async function () {
        const riddler = await deployRiddlerContract();
        const minAmount = await riddler.getMinDepositAmount();

        await riddler.createRiddle("crane", "juice");
        await expect(riddler.guess(0, "wrong answer", {
            value: minAmount,
        })).not.to.emit(riddler, "RiddleSolved")
    });


    it("should not be able to solve a solved riddle", async function () {
        const riddler = await deployRiddlerContract();
        const minAmount = await riddler.getMinDepositAmount();
        await riddler.createRiddle("crane", "juice");
        await expect(riddler.guess(0, "juice", {
            value: minAmount,
        })
        ).not.to.be.reverted;

        await expect(riddler.guess(0, "juice", {
            value: minAmount,
        })).to.be.revertedWith("riddle already solved");
    });

    it("withdraws the funds from the contract", async function () {
        const riddler = await deployRiddlerContract();
        //send 1 wei in when creating a riddle


        await riddler.createRiddle("crane", "juice", {
            value: BigNumber.from(1),
        });
        //expect the contracts balance to be 1 wei
        expect(await ethers.provider.getBalance(riddler.address)).to.be.eq(1);

        await riddler.withdraw();

        expect(await ethers.provider.getBalance(riddler.address)).to.be.eq(0);
        const signer = await ethers.getSigners();
        const address = await signer[0].getAddress();
        expect(await ethers.provider.getBalance(address)).to.be.gt(0);
    });

    it("reverts when non-owner tries to withdraw funds", async function () {
        const riddler = await deployRiddlerContract();
        //send 1 wei in when creating a riddle

        await riddler.createRiddle("crane", "juice", {
            value: BigNumber.from(1),
        });

        //expect the contracts balance to be 1 wei
        expect(await ethers.provider.getBalance(riddler.address)).to.be.eq(1);

        const signers = await ethers.getSigners();
        const signer = await signers[1]; //not the owner

        await expect(riddler.connect(signer).withdraw()).to.be.revertedWith(
            "only owner can do this");

    });
})
    ;
