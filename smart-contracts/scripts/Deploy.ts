import { ethers } from "ethers";
import { LotteryToken__factory, Lottery__factory } from "../typechain-types";

import * as dotenv from "dotenv";

dotenv.config();

const BET_PRICE = 1;
const BET_FEE = 0.2;
const TOKEN_RATIO = 1;
const TOKEN_NAME = "LotteryToken";
const TOKEN_SYMBOL = "LTK";

export async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "goerli",
    process.env.ALCHEMY_API_KEY
  );
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  const tokenFactory = new LotteryToken__factory(deployer);
  const tokenContract = await tokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  await tokenContract.deployed();
  console.log(`Token contract deployed on ${tokenContract.address}`);

  const lotteryContractFactory = new Lottery__factory(deployer);
  const lotteryContract = await lotteryContractFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_RATIO,
    ethers.utils.parseEther(BET_PRICE.toFixed(18)),
    ethers.utils.parseEther(BET_FEE.toFixed(18))
  );
  await lotteryContract.deployed();
  console.log(`Lottery contract deployed on ${lotteryContract.address}`);

  const tokenAddress = await lotteryContract.paymentToken();
  console.log(`Attached to the payment token address: ${tokenAddress}`);
  const token = tokenFactory.attach(tokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
