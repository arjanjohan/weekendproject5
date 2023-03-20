import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequestTokensDto } from 'dtos/RequestTokensDto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/token-contract-address')
  getTokenContractAddress(): { address: string } {
    return { address: this.appService.getTokenContractAddress() };
  }

  @Get('/lottery-contract-address')
  getLotteryContractAddress(): { address: string } {
    return { address: this.appService.getLotteryContractAddress() };
  }

  @Get('/transaction-status')
  async getTransactionStatus(@Query('hash') hash: string): Promise<string> {
    return this.appService.getTransactionStatus(hash);
  }

  @Post('/request-tokens')
  async requestTokens(@Body() body: RequestTokensDto) {
    return { result: this.appService.requestTokens(body.address, body.amount) };
  }

  @Get('/check-status')
  async checkState() {
    return this.appService.checkState();
  }
}
