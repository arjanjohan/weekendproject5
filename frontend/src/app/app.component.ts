import { Component, Provider } from '@angular/core';
import { Wallet, Contract, ethers, utils, BigNumber } from 'ethers';
import { HttpClient } from '@angular/common/http';
import tokenJson from '../assets/MyToken.json';
import lotteryJson from '../assets/Lottery.json';

import { environment } from '..//environments/environment.prod';

const API_URL = 'http://localhost:3000/token-contract-address';
const API_URL_MINT = 'http://localhost:3000/request-tokens';

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
  tokenContractAddress: string | undefined;
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;

  // votingPower: number | undefined;
  // ballotContract: Contract | undefined;

  state: boolean | undefined;
  lotteryContractAddress: string | undefined;
  lotteryContract: Contract | undefined;
  currentBlock: number | undefined;
  currentBlockDate: Date | undefined;
  closingTime: number | undefined;
  closingTimeDate: Date | undefined;

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
  }

  connectWallet(privateKey: string) {
    this.userWallet = new Wallet(privateKey).connect(this.provider);
    console.log('Wallet address: ' + this.userWallet.address);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    });
  }

  checkState() {
    // if (!this.lotteryContractAddress) return;
    // this.lotteryContract = new Contract(
    //   this.lotteryContractAddress,
    //   lotteryJson.abi,
    //   this.userWallet ?? this.provider
    // );
    // this.state = new this.lotteryContract['betsOpen']();
    // this.provider.getBlock('latest').then((block) => {
    //   this.currentBlock = block.number;
    //   this.currentBlockDate = new Date(block.timestamp * 1000);
    // });
    // this.closingTime = this.lotteryContract['betsClosingTime']();
    // if (this.closingTime instanceof BigNumber) {
    //   this.closingTimeDate = new Date(
    //     (this.closingTime as BigNumber).toNumber() * 1000
    //   );
    // }
  }

  buyTokens(index: string, amount: string) {
    //   const tx = await contract.connect(accounts[Number(index)]).purchaseTokens({
    //     value: ethers.utils.parseEther(amount).div(TOKEN_RATIO),
    //   });
    //   const receipt = await tx.wait();
    //   console.log(`Tokens bought (${receipt.transactionHash})\n`);
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
  }

  // getTokenAddres() {
  //   return this.http.get<{ address: string }>(API_URL);
  // }

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

  // requestTokens(amount: string) {
  //   const body = { address: this.userWallet?.address, amount: amount };
  //   console.log('BODY', body);
  //   return this.http
  //     .post<{ result: string }>(API_URL_MINT, body)
  //     .subscribe((result) => {
  //       console.log('tx hash = ' + result.result);
  //     });
  // }
}
