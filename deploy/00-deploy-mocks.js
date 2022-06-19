const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //helper hardhat config에 있는 애들이면, 이런 식으로 mocking 실행
  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      //args가 필요한지는 node_modulus -> chainlink 들어가서 MockV3Aggregator 확인
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mocks deployed!");
    log(
      "-----------------------------------------------------------------------------"
    );
  }
};

//tags는 뒤에 저 말이 붙을때만 deploy되게 만들어 놓은것
module.exports.tags = ["all", "mocks"];
