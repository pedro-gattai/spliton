import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { UserService, CreateUserDto } from './user.service';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * POST /user
   * Cria um novo usuário
   */
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      this.logger.log('Requisição para criar usuário');
      const user = await this.userService.createUser(createUserDto);
      return {
        success: true,
        data: user,
        message: 'Usuário criado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro na rota createUser: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /user/wallet/:address
   * Busca um usuário pelo endereço da carteira
   */
  @Get('wallet/:address')
  async findByWalletAddress(@Param('address') address: string) {
    try {
      this.logger.log(`Buscando usuário por endereço: ${address}`);
      const user = await this.userService.findByWalletAddress(address);

      if (!user) {
        return {
          success: false,
          data: null,
          message: 'Usuário não encontrado',
        };
      }

      return {
        success: true,
        data: user,
        message: 'Usuário encontrado',
      };
    } catch (error) {
      this.logger.error(`Erro na rota findByWalletAddress: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /user/:id
   * Busca um usuário pelo ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      this.logger.log(`Buscando usuário por ID: ${id}`);
      const user = await this.userService.findById(id);

      if (!user) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Usuário não encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: user,
        message: 'Usuário encontrado',
      };
    } catch (error) {
      this.logger.error(`Erro na rota findById: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /user/:id
   * Atualiza um usuário
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateUserDto>,
  ) {
    try {
      this.logger.log(`Atualizando usuário: ${id}`);
      const user = await this.userService.updateUser(id, updateData);
      return {
        success: true,
        data: user,
        message: 'Usuário atualizado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro na rota updateUser: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /user/:userId/stats
   * Retorna estatísticas do usuário
   */
  @Get(':userId/stats')
  async getUserStats(@Param('userId') userId: string) {
    try {
      this.logger.log(`Buscando estatísticas do usuário: ${userId}`);
      const stats = await this.userService.getUserStats(userId);
      return {
        success: true,
        data: stats,
        message: 'Estatísticas do usuário recuperadas com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro na rota getUserStats: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /user/search/:identifier
   * Busca um usuário por username ou endereço da carteira
   */
  @Get('search/:identifier')
  async searchUser(@Param('identifier') identifier: string) {
    try {
      this.logger.log(`🔍 Controller: Buscando usuário por: "${identifier}"`);

      // DECODIFICAR parâmetro URL:
      const decodedIdentifier = decodeURIComponent(identifier);

      const user = await this.userService.searchUser(decodedIdentifier);

      // SEMPRE retornar success: true, mesmo quando não encontra:
      return {
        success: true,
        data: user, // pode ser null
        message: user ? 'Usuário encontrado' : 'Usuário não encontrado',
      };
    } catch (error) {
      this.logger.error(
        `❌ Controller: Erro na rota searchUser: ${error.message}`,
      );

      throw new HttpException(
        {
          success: false,
          error: 'Erro interno do servidor',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
