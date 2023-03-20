import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as tokenJson from './/assets/LotteryToken.json';
import * as lotteryJson from './/assets/Lottery.json';

const TOKEN_CONTRACT_ADDRESS = '0x7a511e39a98f2A9fe50995C32a4fCD4Ea17113C5';
const LOTTERY_CONTRACT_ADDRESS = '0xF63e52D63D0cE2b4EF146E280DF825306f05D0F5';

@Injectable()
export class AppService {
  provider;
  tokenContract;
  lotteryContract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.providers.AlchemyProvider(
      'goerli',
      this.configService.get<string>('ALCHEMY_API_KEY'),
    );
    this.tokenContract = new ethers.Contract(
      TOKEN_CONTRACT_ADDRESS,
      tokenJson.abi,
      this.provider,
    );
    this.lotteryContract = new ethers.Contract(
      LOTTERY_CONTRACT_ADDRESS,
      lotteryJson.abi,
      this.provider,
    );
  }
  getTokenContractAddress(): string {
    return this.tokenContract.address;
  }
  getLotteryContractAddress(): string {
    return this.lotteryContract.address;
  }

  async getTokenBalance(address: string): Promise<number>  {
    const balanceBN = await this.tokenContract.balanceOf(address);
    console.log(balanceBN);
    const balanceString = ethers.utils.formatEther(balanceBN);
    console.log(balanceString);
    
    const balanceNumber = parseFloat(balanceString);
    return balanceNumber;
  }

  async getTransactionStatus(hash: string): Promise<string> {
    const tx = await this.provider.getTransaction(hash);
    const txReceipt = await tx.wait();
    return txReceipt.status == 1 ? 'Completed' : 'Reverted';
  }

  async requestTokens(address: string, amount: number) {
    const amountEther = ethers.utils.parseEther(amount.toString());
    const privateKey = this.getPrivateKey();
    const wallet = new ethers.Wallet(privateKey).connect(this.provider);
    const tx = await this.lotteryContract.connect(wallet).purchaseTokens({value: amountEther});
    const txReceipt = await tx.wait();
    return txReceipt.status == 1 ? 'Completed' : 'Reverted';
  }

  getPrivateKey(){
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (!privateKey || privateKey.length <= 0) {
      throw new Error('Private key missing');
    }
    return privateKey;
  }
}
