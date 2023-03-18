import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  MyToken,
  MyToken__factory,
  TokenSale,
  TokenSale__factory,
} from "../typechain-types";

const TEST_TOKEN_RATIO = 1;
const TEST_TOKEN_PRICE = ethers.utils.parseEther("0.02");
const TEST_TOKEN_MINT = ethers.utils.parseEther("1");
const TEST_NFT_ID = 42;

describe("NFT Shop", async () => {
  let tokenSaleContract: TokenSale;
  let tokenContract: MyToken;
  let deployer: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, account1, account2] = await ethers.getSigners();

    // deploying the contract for ERC20
    const tokenContractFactory = new MyToken__factory(deployer);
    tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployTransaction.wait();

    // deploying the tokenSale contract
    const tokenSaleContractFactory = new TokenSale__factory(deployer);
    tokenSaleContract = await tokenSaleContractFactory.deploy(
      TEST_TOKEN_RATIO,
      TEST_TOKEN_PRICE,
      tokenContract.address
    );
    await tokenSaleContract.deployTransaction.wait();

    // granting minterRole in ERC20
    const minterRole = await tokenContract.MINTER_ROLE();
    const giveTokenMintRoleTx = await tokenContract.grantRole(
      minterRole,
      tokenSaleContract.address
    );
    await giveTokenMintRoleTx.wait();
  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_TOKEN_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const tokenAddress = await tokenSaleContract.tokenAddress();
      const tokenContractFactory = new MyToken__factory(deployer);
      const tokenUsedInContract = tokenContractFactory.attach(tokenAddress);
      await expect(tokenUsedInContract.totalSupply()).to.not.be.reverted;
      await expect(tokenUsedInContract.balanceOf(account1.address)).to.not.be
        .reverted;
      await expect(
        tokenUsedInContract.transfer(account1.address, 1)
      ).to.not.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("When a user buys an ERC20 from the Token contract", async () => {
    let tokenBalanceBeforeMint: BigNumber;
    let ethBalanceBeforeMint: BigNumber;
    let mintTxGasCost: BigNumber;

    beforeEach(async () => {
      tokenBalanceBeforeMint = await tokenContract.balanceOf(account1.address);
      ethBalanceBeforeMint = await account1.getBalance();

      const buyTokensTx = await tokenSaleContract
        .connect(account1)
        // since buyTokens is payable we have to give a
        // value of how much we are paying. this value will
        // be multiplied by the ratio to calculate the amount of tokens to mint
        .buyTokens({ value: TEST_TOKEN_MINT });
      const buyTokenTxReceipt = await buyTokensTx.wait();
      mintTxGasCost = buyTokenTxReceipt.gasUsed.mul(
        buyTokenTxReceipt.effectiveGasPrice
      );
    });

    it("charges the correct amount of ETH", async () => {
      const ethBalanceAfterMint = await account1.getBalance();
      const expected = TEST_TOKEN_MINT.add(mintTxGasCost);
      const diff = ethBalanceBeforeMint.sub(ethBalanceAfterMint);
      const error = diff.sub(expected);
      expect(error).to.eq(0);
    });

    it("gives the correct amount of tokens", async () => {
      const tokenBalanceAfterMint = await tokenContract.balanceOf(
        account1.address
      );
      expect(tokenBalanceAfterMint.sub(tokenBalanceBeforeMint)).to.eq(
        TEST_TOKEN_MINT.mul(TEST_TOKEN_RATIO)
      );
    });

    describe("When a user burns an ERC20 at the Shop contract", async () => {
      let tokenBalanceBeforeBurn: BigNumber;
      let ethBalanceBeforeBurn: BigNumber;
      let burnAmount: BigNumber; // how many tokens got burned
      let allowTxGasCost: BigNumber;
      let burnTxGasCost: BigNumber;

      beforeEach(async () => {
        ethBalanceBeforeBurn = await account1.getBalance();
        tokenBalanceBeforeBurn = await tokenContract.balanceOf(
          account1.address
        );

        burnAmount = tokenBalanceBeforeBurn.div(2);

        // we need to allow the smart contract to interact with our money
        // this costs gas
        const allowTx = await tokenContract
          .connect(account1)
          .approve(tokenSaleContract.address, burnAmount);
        const allowTxReceipt = await allowTx.wait();
        allowTxGasCost = allowTxReceipt.gasUsed.mul(
          allowTxReceipt.effectiveGasPrice
        );

        // burning costs gas as well
        const burnTx = await tokenSaleContract
          .connect(account1)
          .burnTokens(burnAmount);
        const burnTxReceipt = await burnTx.wait();
        burnTxGasCost = burnTxReceipt.gasUsed.mul(
          burnTxReceipt.effectiveGasPrice
        );
      });

      it("gives the correct amount of ETH", async () => {
        const ethBalanceAfterBurn = await account1.getBalance();
        const diff = ethBalanceAfterBurn.sub(ethBalanceBeforeBurn);
        const costs = allowTxGasCost.add(burnTxGasCost);
        expect(diff).to.eq(burnAmount.div(TEST_TOKEN_RATIO).sub(costs));
      });

      it("burns the correct amount of tokens", async () => {
        const tokenBalanceAfterBurn = await tokenContract.balanceOf(
          account1.address
        );
        const diff = tokenBalanceBeforeBurn.sub(tokenBalanceAfterBurn);
        expect(diff).to.eq(burnAmount);
      });
    });

    describe("When a user buys an NFT from the Shop contract", async () => {
      let tokenBalanceBeforeBuyNFT: BigNumber;

      beforeEach(async () => {
        tokenBalanceBeforeBuyNFT = await tokenContract.balanceOf(
          account1.address
        );

        // needs to be approved
        const allowTx = await tokenContract
          .connect(account1)
          .approve(tokenSaleContract.address, TEST_TOKEN_PRICE);
        await allowTx.wait();

        const buyTx = await tokenSaleContract
          .connect(account1)
          .buyNFT(TEST_NFT_ID);
        await buyTx.wait();
      });
      it("charges the correct amount of ERC20 tokens", async () => {
        const tokenBalanceAfterBuyNFT = await tokenContract.balanceOf(
          account1.address
        );
        const diff = tokenBalanceBeforeBuyNFT.sub(tokenBalanceAfterBuyNFT);
        expect(diff).to.be.eq(TEST_TOKEN_PRICE);
      });

      it("gives the correct NFT", async () => {
        throw new Error("Not implemented");
      });
    });
  });

  describe("When a user burns their NFT at the Shop contract", async () => {
    beforeEach(async () => {});

    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraws from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner pool account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});
