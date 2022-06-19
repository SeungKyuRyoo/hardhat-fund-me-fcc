// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // 바깥 contract와 상호작용 = ABI, ADDRESS 필요
        // address = ETH/USD :0x9326BFA02ADD2366b30bacB125260Af641031331
        // ABI = interface로 얻는다 => 깃헙으로 찾을 수 있음
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10); // 이거 하는 이유가 price의 decimal이 8자리인데 1eth 는 decimal이 18자리이기때문
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        return (ethAmount * ethPrice) / 1e18;
    }
}
