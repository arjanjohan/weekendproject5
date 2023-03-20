import { Component, Provider } from '@angular/core';
import { Wallet, Contract, ethers, utils, BigNumber } from 'ethers';
import { HttpClient } from '@angular/common/http';
import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/Lottery.json';
// import lotteryTokenJson from '../assets/LotteryToken.json';

import { environment } from '..//environments/environment.prod';

const API_TOKEN_URL = 'http://localhost:3000/token-contract-address';
const API_LOTTERY_URL = 'http://localhost:3000/lottery-contract-address';
const API_URL_MINT = 'http://localhost:3000/request-tokens';

const TOKEN_RATIO = 1;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.BaseProvider;
  userWallet: Wallet | null = null;
  userEthBalance: number | undefined;
  userTokenBalance: number | undefined;
  // tokenContractAddress: string | undefined;
  // tokenContract: Contract | undefined;
  // tokenTotalSupply: number | string | undefined;

  // votingPower: number | undefined;
  // ballotContract: Contract | undefined;

  state: boolean | undefined;
  lotteryContractAddress: string | undefined;
  lotteryContract: Contract | undefined;
  lotteryTokenContractAddress: string | undefined;
  lotteryTokenContract: Contract | undefined;
  currentBlock: number | undefined;
  currentBlockDate: Date | undefined;
  closingTime: number | undefined;
  closingTimeDate: Date | undefined;
  amount: string = '0';

  privateKey = environment.privateKey;
  alchemyApiKey = environment.alchemyApiKey;

  constructor(private http: HttpClient) {
    this.provider = new ethers.providers.AlchemyProvider(
      'goerli',
      this.alchemyApiKey
    );

    if (!this.privateKey || this.privateKey.length <= 0) {
      throw new Error('Private key missing');
    }

    this.getLotteryContractAddress().subscribe((data) => {
      this.lotteryContractAddress = data.address;
    });

    this.getTokenAddres().subscribe((data) => {
      this.lotteryTokenContractAddress = data.address;
    });
  }

  connectWallet(privateKey: string) {
    this.userWallet = new Wallet(privateKey).connect(this.provider);
    console.log('Wallet address: ' + this.userWallet.address);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    });
    this.displayTokenBalance(privateKey);
  }

  async displayTokenBalance(privateKey: string) {
    console.log("Token address: ", this.lotteryTokenContractAddress);
    if (!this.lotteryTokenContractAddress) return;
    this.lotteryTokenContract = new Contract(
      this.lotteryTokenContractAddress,
      lotteryJson.abi,
      this.userWallet ?? this.provider
    );
    const balanceBN = await this.lotteryTokenContract['balanceOf'](
      this.userWallet
    );

    const balance = ethers.utils.formatEther(balanceBN);
    this.userTokenBalance = parseFloat(balance);
  }

  getTokenAddres() {
    return this.http.get<{ address: string }>(API_TOKEN_URL);
  }

  getLotteryContractAddress() {
    return this.http.get<{ address: string }>(API_LOTTERY_URL);
  }

  async checkState() {
    if (!this.lotteryContractAddress) return;
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.userWallet ?? this.provider
    );
    this.state = await this.lotteryContract['betsOpen']();
    if (!this.state) return;
    this.provider.getBlock('latest').then((block) => {
      this.currentBlock = block.number;
      this.currentBlockDate = new Date(block.timestamp * 1000);
    });
    this.closingTime = await this.lotteryContract['betsClosingTime']();
    if (!this.closingTime) return;
    this.closingTimeDate = new Date(this.closingTime * 1000);
  }

  async buyTokens(amount: string) {
    console.log('Waiting...payment in progress...');
    console.log('Contract address:', this.lotteryContractAddress)
    if (!this.lotteryContractAddress) return;
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.userWallet ?? this.provider
    );
    const tx = await this.lotteryContract['purchaseTokens']({
      value: ethers.utils.parseEther(amount).div(TOKEN_RATIO),
    });
    const receipt = await tx.wait();
    console.log(`Tokens bought (${receipt.transactionHash})\n`);
  }

  // updateTokenInfo() {
  //   if (!this.tokenContractAddress) return;
  //   this.tokenContract = new Contract(
  //     this.tokenContractAddress,
  //     tokenJson.abi,
  //     this.userWallet ?? this.provider
  //   );
  //   this.tokenTotalSupply = 'Loading...';
  //   this.tokenContract['totalSupply']().then((totalSupplyBN: BigNumber) => {
  //     const totalSupplyStr = utils.formatEther(totalSupplyBN);
  //     this.tokenTotalSupply = parseFloat(totalSupplyStr);
  //   });
  //}

  // syncBlock() {
  //   this.blockNumber = 'loading...';
  //   this.provider.getBlock('latest').then((block) => {
  //     this.blockNumber = block.number;
  //   });
  //   this.getTokenAddres().subscribe((response) => {
  //     this.tokenContractAddress = response.address;
  //     this.updateTokenInfo();
  //   });
  // }

  // clearBlock() {
  //   this.blockNumber = 0;
  // }

  // updateTokenInfo() {
  //   if (!this.tokenContractAddress) return;
  //   this.tokenContract = new Contract(
  //     this.tokenContractAddress,
  //     tokenJson.abi,
  //     this.userWallet ?? this.provider
  //   );
  //   this.tokenTotalSupply = 'Loading...';
  //   this.tokenContract['totalSupply']().then((totalSupplyBN: BigNumber) => {
  //     const totalSupplyStr = utils.formatEther(totalSupplyBN);
  //     this.tokenTotalSupply = parseFloat(totalSupplyStr);
  //   });
  // }

  // createWallet() {
  //   this.userWallet = Wallet.createRandom().connect(this.provider);
  //   this.userWallet.getBalance().then((balanceBN) => {
  //     const balanceStr = utils.formatEther(balanceBN);
  //     this.userEthBalance = parseFloat(balanceStr);
  //   });
  // }
}
