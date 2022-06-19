const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1"); // = 1eth
  beforeEach(async function () {
    // deploy hardhat contract
    // fixture : run entire deploy folder
    //ethers.getSigners = hardhat config의 account section에 있는 애들 꺼내옴
    //hardhat 은 fake account 불러와줌
    // const accounts = await ethers.getSigners();
    // const accountZero = accounts[0];
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundMe.s_priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", async function () {
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough");
    });

    it("updated the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      //mapping이기 때문에 deployer의 주소를 주면 amount가 나와야됨
      const response = await fundMe.s_addressToAmountFunded(deployer);
      //response는 big number로 나오기 때문에 toString 필요
      assert.equal(response.toString(), sendValue.toString());
    });
    it("updated s_funders to array", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.s_funders(0);
      assert.equal(deployer, funder);
    });
  });

  describe("withdraw", async function () {
    //withdraw 하기 전에 contract에 돈이 있어야함으로 beforeEach로 돈을 미리 넣는다
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("withdraw ETH from a single founder", async function () {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionRecipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionRecipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it("allows us to withdraw with multiple s_funders", async function () {
      //가계정 만드는법
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        // deployer만 연결되어 있으므로 여러 account가 연결되도록
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);

        fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      const transactionResponse = await fundMe.withdraw();
      const transactionRecipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionRecipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      //   assert.equal(
      //     startingFundMeBalance.add(startingDeployerBalance).toString(),
      //     endingDeployerBalance.add(gasCost).toString()
      //   );

      //s_funders 없는지 확인
      await expect(fundMe.s_funders(0)).to.be.reverted;

      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.s_addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Only allows the owner to withdraw", async function () {
      const accounts = ethers.getSigners();
      const attackers = accounts[1];

      const attackerConnectedContract = await fundMe.connect(attackers);

      await expect(attackerConnectedContract.withdraw()).to.be.reverted;
    });

    it("allows us to withdraw cheaper with multiple s_funders", async function () {
      //가계정 만드는법
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        // deployer만 연결되어 있으므로 여러 account가 연결되도록
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);

        fundMeConnectedContract.fund({ value: sendValue });
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionRecipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionRecipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      //   assert.equal(
      //     startingFundMeBalance.add(startingDeployerBalance).toString(),
      //     endingDeployerBalance.add(gasCost).toString()
      //   );

      //s_funders 없는지 확인
      await expect(fundMe.s_funders(0)).to.be.reverted;

      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.s_addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
  });
});
