// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// Get funds from users;
// Withdraw funds
// Set a minimum funding value in USD

//npm package or github

import "./PriceConverter.sol";

//Error codes
error FundMe__NotOwner();

/** @title A contract for crowd funding
 *  @author SeungKyu Ryoo
 *  @notice This contract is to demo a sample contract
 *  @dev This implement price feeds as a library
 */
contract FundMe {
    //Type Decleartion
    using PriceConverter for uint256;

    // State Variables
    //안바뀌는 애들은 constant쓰면 gas 줄어듬 => 원래는 이름 모두 대문자로
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] public s_funders;
    mapping(address => uint256) public s_addressToAmountFunded;

    //immutable은 constructor로 변경 가능, constant는 아예 불가능
    address public immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // constructor
    // receive function (if exists)
    // fallback function (if exists)
    // external
    // public
    // internal
    // private

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // want to be able to set a minimum fund amount in USD
        // 1. How do we send ETH to this contract?
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); //=1eth
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
        //revert = undo action before, and send remaining gas
    }

    function withdraw() public onlyOwner {
        //보낸사람 돈 0으로
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        //0번부터 모두 삭제
        s_funders = new address[](0);

        //contract 돈 보내는 법 : transfer send call

        // //transfer 실패하면 error
        // payable(msg.sender).transfer(address(this).balance);

        // //send 실패하면 bool
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // //밑에 require로 revert
        // require(sendSuccess, "Send failed");

        //call
        (bool CallSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(CallSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);

        //fund me 안쓰고 contract에 ETH를 보낸다면?

        //recieve();
        //Fallback();

        // function getOwner() public view returns (address) {
        //     return i_owner;
        // }

        // function getFunder(uint256 index) public view returns (address) {
        //     return s_funders[index];
        // }

        // function getAddressToAmountFunded(address funder)
        //     public
        //     view
        //     returns (uint256)
        // {
        //     return AddressToAmountFunded[funder];
        // }

        // function getPriceFeed() public view returns (AggregatorV3Inderface) {
        //     return s_priceFeed;
        // }
    }
}
