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

  async getTransactionStatus(hash: string): Promise<string> {
    const tx = await this.provider.getTransaction(hash);
    const txReceipt = await tx.wait();
    return txReceipt.status == 1 ? 'Completed' : 'Reverted';
  }

  async requestTokens(address: string, amount: number) {
    const privateKey = this.getPrivateKey();
    const wallet = new ethers.Wallet(privateKey).connect(this.provider);
    const tx = await this.lotteryContract.connect(wallet).purchaseTokens();
    const txReceipt = await tx.wait();
    return txReceipt.status == 1 ? 'Completed' : 'Reverted';
  }

  getPrivateKey() {
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    //console.log(privateKey);
    if (!privateKey || privateKey.length <= 0) {
      throw new Error('Private key missing');
    }
    return privateKey;
  }

  async checkState() {
    const state = this.lotteryContract.betsOpen();
    console.log(state);
    if (!state) return;
    const currentBlock = this.provider.getBlock('latest');
    const currentBlockDate = new Date(currentBlock.timestamp * 1000);
    const closingTime = this.lotteryContract.betsClosingTime();
    const closingTimeDate = new Date(closingTime.toNumber() * 1000);
  }
}
