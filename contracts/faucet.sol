//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// initiate the faucet contract
contract Faucet {
    address public owner;

    constructor() payable {
        owner = payable(msg.sender);
    }

    // an array of people that tranferred to the contract
    address[] public funders;

    // a mapping of the address of funders to the amount funded
    mapping(address => uint256) public addressToAmountFunded;

    // public withdraw function
    function withdraw(uint _amount) public {
        // check if the amount is less than or equal to 0.1eth
        require(_amount <= 100000000000000000, "Max amount exceeded!");

        // transfer the amount to the address of the caller of the contract
        (bool callSuccess, ) = payable(msg.sender).call{value: _amount}("");
        require(callSuccess, "call failed now!");
    }

    function withdrawAll() public onlyOwner {
        (bool callSuccess, ) = owner.call{value: address(this).balance}("");
        require(callSuccess, "Transaction reverted");
    }

    // a fund function that recieves payment to the contract when called and (when not called because of the receive and fallback functions)
    function fund() public payable {
        funders.push(msg.sender);

        addressToAmountFunded[msg.sender] += msg.value;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Not Owner");
        _;
    }

    // this function handles any payment to the contract address
    receive() external payable {}

    fallback() external payable {
        fund();
    }
}

//  0xAf80b6aB73ecD485cf0AfDb556284a48E55922b4
