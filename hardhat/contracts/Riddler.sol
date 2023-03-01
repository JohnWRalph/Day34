// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Riddler {
    address owner;
    uint256 minDeposittoGuess;
    //we need some way to stor ehte riddles.
    // we can define one as a Riddle struct.

    struct Riddle {
        string question;
        bytes32 answer;
        bool isSolved;
        uint256 wrongGuessRewardamount;
        uint256 createRiddleRewardAmount;
    }

    // store all of our riddles in this array
    Riddle[] riddles;

    //emit an event when a riddle is created
    event RiddleCreated(string question, string answer);

    // make an event when a riddle is correctly guessed
    event RiddleSolved(address solver, string answer, uint256 rewardAmount);

    // send ETH to this contract to server as a reward for correct guessing
    constructor() payable {
        owner = msg.sender;
        minDeposittoGuess = 1 wei;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can do this");
        _;
    }

    function getMinDepositAmount() external view returns (uint256) {
        return minDeposittoGuess;
    }

    function createRiddle(
        string memory question,
        string memory answer
    ) public payable onlyOwner {
        bytes32 hashedAnswer = keccak256(abi.encodePacked(answer));
        Riddle memory riddle = Riddle(
            question,
            hashedAnswer,
            false,
            0,
            msg.value
        );
        riddles.push(riddle);

        emit RiddleCreated(question, answer);
    }

    function getriddles() public view returns (Riddle[] memory) {
        return riddles;
    }

    function guess(
        uint256 index,
        string memory answer
    ) external payable returns (bool) {
        Riddle memory riddle = riddles[index];
        require(!riddle.isSolved, "riddle already solved");
        require(msg.value == minDeposittoGuess, "wrong deposit amount");

        if (riddle.answer == keccak256(abi.encodePacked(answer))) {
            riddles[index].isSolved = true;
            //pay the winner
            emit RiddleSolved(
                msg.sender,
                answer,
                riddle.wrongGuessRewardamount + riddle.createRiddleRewardAmount
            );
            payable(msg.sender).transfer(
                riddle.wrongGuessRewardamount + riddle.createRiddleRewardAmount
            );
            return true;
        } else {
            //wrong guess
            riddles[index].wrongGuessRewardamount += msg.value;
        }
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
