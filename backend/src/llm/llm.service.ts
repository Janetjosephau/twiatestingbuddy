import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LlmAdapterFactory } from './adapters/llm-adapter.factory';
import { TestConnectionDto } from './dto/test-connection.dto';
import { CreateLlmConfigDto } from './dto/create-llm-config.dto';
import { UpdateLlmConfigDto } from './dto/update-llm-config.dto';

@Injectable()
export class LlmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterFactory: LlmAdapterFactory,
  ) {}

  async testConnection(testConnectionDto: TestConnectionDto) {
    try {
      const adapter = this.adapterFactory.getAdapter(testConnectionDto.provider);
      const result = await adapter.testConnection(testConnectionDto);

      return {
        success: result.success,
        status: result.success ? 'connected' : 'failed',
        message: result.success ? 'Connection Successful! Your LLM is ready.' : `Connection Failed: ${result.error}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: `Connection Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createConfig(createLlmConfigDto: CreateLlmConfigDto) {
    try {
      const config = await this.prisma.lLMConfig.create({
        data: {
          provider: createLlmConfigDto.provider,
          name: createLlmConfigDto.name,
          apiKey: createLlmConfigDto.apiKey, 
          apiUrl: createLlmConfigDto.apiUrl,
          model: createLlmConfigDto.model,
          temperature: createLlmConfigDto.temperature ?? 0.7,
          maxTokens: createLlmConfigDto.maxTokens ?? 2048,
          testStatus: 'untested',
        },
      });

      return {
        ...config,
        message: 'LLM Configuration saved successfully!'
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to save configuration: ${error.message}`);
    }
  }

  async getAllConfigs() {
    const configs = await this.prisma.lLMConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(config => ({
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    }));
  }

  async getConfig(id: string) {
    const config = await this.prisma.lLMConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
    };
  }

  async updateConfig(id: string, updateLlmConfigDto: UpdateLlmConfigDto) {
    try {
      const updatedConfig = await this.prisma.lLMConfig.update({
        where: { id },
        data: {
          ...updateLlmConfigDto,
        },
      });

      return {
        ...updatedConfig,
        message: 'LLM Configuration updated successfully!'
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to update configuration: ${error.message}`);
    }
  }

  async deleteConfig(id: string) {
    try {
      await this.prisma.lLMConfig.delete({
        where: { id },
      });
      return { message: 'LLM configuration deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete this configuration because it is currently used by your saved Test Plans.');
      }
      throw new NotFoundException('LLM configuration not found or could not be deleted');
    }
  }

  async generateText(prompt: string, configId: string) {
    const config = await this.prisma.lLMConfig.findUnique({
      where: { id: configId }
    });
    
    if (!config) throw new NotFoundException('LLM configuration not found');

    const adapter = this.adapterFactory.getAdapter(config.provider);
    const result = await adapter.generateText(prompt, config);

    if (!result.success) {
      throw new BadRequestException(`Generation failed: ${result.error}`);
    }

    return result.text;
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length <= 8) return '********';
    return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
  }
}