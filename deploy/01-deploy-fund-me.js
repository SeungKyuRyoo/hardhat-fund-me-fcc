// import
// main function
// calling of main function

// function deployFunc() {
//   console.log("Hi!");
//   hre.getNamedAccounts();
//   hre.deployment
// }

// module.exports.default = deployFunc;

const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");

const { verify } = require("../utils/verify");
//얘는 아래 두줄 이랑 똑같음 => "helper hardhat config"에서 networkConfig라는 것만 뽑아서 쓸때 필요
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  //==hre.getNamedAccounts+hre.deployments 와 동일 위에서 저렇게 정의하면 hre.을 안써도됨
};

//위에와 동일한 것
module.exports = async ({ getNamedAccounts, deployments }) => {
  //deployment folder에서 deploy, log라는 함수를 빼내는 것
  const { deploy, log } = deployments;
  //get Named account에서 deployer account를 빼낸다
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // chainId에 따라 서로 다른 networkConfig를 얻을 수 있음
  //   const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  // *** mocking : chainFeedAddress가 없는 애들은 priceFeed를 어떻게 받아오냐?

  let ethUsdPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPrice"];
  }

  // when going for localhost or hardhat network we want to use a mock
  // hardhat deploy쓰면 contractFactory 안쓰고 바로 이렇게 쓰면됨
  // deploy("deploy하는 이름"),{from : deploy하는 사람 args : passing arguments
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  //Verify

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
};

module.exports.tags = ["all", "fundMe"];
