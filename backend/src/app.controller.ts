import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      status: 'online',
      message: 'Testing Buddy AI API is running',
      version: '1.0.0',
      docs: '/api/docs'
    };
  }
}
