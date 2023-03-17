import { Component } from '@angular/core';
import { Wallet, Contract, ethers, utils, BigNumber } from 'ethers';
import { HttpClient } from '@angular/common/http';
import tokenJson from '../assets/MyToken.json';

import { environment } from '..//environments/environment';

const API_URL = 'http://localhost:3000/token-contract-address';
const API_URL_MINT = 'http://localhost:3000/request-tokens';
const API_URL_DELEGATE = 'http://localhost:3000/delegate-tokens';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.BaseProvider;
  userWallet: Wallet | undefined;
  userEthBalance: number | undefined;
  userTokenBalance: number | undefined;
  tokenContractAddress: string | undefined;
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;
  votingPower: number | undefined;
  ballotContract: Contract | undefined;

  privateKey = environment.privateKey;
  alchemyApiKey = environment.alchemyApiKey;

  constructor(private http: HttpClient) {
    this.provider = new ethers.providers.AlchemyProvider(
      'goerli',
      this.alchemyApiKey
    );

    console.log(this.privateKey);
    if (!this.privateKey || this.privateKey.length <= 0) {
      throw new Error('Private key missing');
    }
    this.connectWallet(this.privateKey);
  }

  getTokenAddres() {
    return this.http.get<{ address: string }>(API_URL);
  }

  syncBlock() {
    this.blockNumber = 'loading...';
    this.provider.getBlock('latest').then((block) => {
      this.blockNumber = block.number;
    });
    this.getTokenAddres().subscribe((response) => {
      this.tokenContractAddress = response.address;
      this.updateTokenInfo();
    });
  }

  clearBlock() {
    this.blockNumber = 0;
  }

  updateTokenInfo() {
    if (!this.tokenContractAddress) return;
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.userWallet ?? this.provider
    );
    this.tokenTotalSupply = 'Loading...';
    this.tokenContract['totalSupply']().then((totalSupplyBN: BigNumber) => {
      const totalSupplyStr = utils.formatEther(totalSupplyBN);
      this.tokenTotalSupply = parseFloat(totalSupplyStr);
    });
  }

  createWallet() {
    this.userWallet = Wallet.createRandom().connect(this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    });
  }

  connectWallet(privateKey: string) {
    this.userWallet = new Wallet(privateKey).connect(this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    });
  }

  requestTokens(amount: string) {
    const body = { address: this.userWallet?.address, amount: amount };
    console.log('BODY', body);
    return this.http
      .post<{ result: string }>(API_URL_MINT, body)
      .subscribe((result) => {
        console.log('tx hash = ' + result.result);
      });
  }

  // TODO
  async delegate(address: string) {
    const body = { address: address };
    console.log('BODY', body);
    return this.http
      .post<{ result: string }>(API_URL_DELEGATE, body)
      .subscribe((result) => {
        console.log('tx hash = ' + result.result);
      });
  }

  //TODO
  async vote(proposal: string, votes: string) {
    const voteTx = await this.ballotContract
      ?.connect(this.userWallet!)
      ['vote'](parseInt(proposal), parseInt(votes));
    await voteTx.wait();
  }
}
