import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { GroupService, CreateGroupDto } from './group.service';

@Controller('group')
export class GroupController {
  private readonly logger = new Logger(GroupController.name);

  constructor(private readonly groupService: GroupService) {}

  /**
   * POST /group
   * Cria um novo grupo e envia convites
   */
  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    try {
      this.logger.log('Requisição para criar grupo');
      const group = await this.groupService.createGroup(createGroupDto);
      return {
        success: true,
        data: group,
        message: 'Grupo criado com sucesso e convites enviados',
      };
    } catch (error) {
      this.logger.error(`Erro na rota createGroup: ${error.message}`);
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
   * GET /group/user/:userId
   * Busca grupos de um usuário
   */
  @Get('user/:userId')
  async getUserGroups(@Param('userId') userId: string) {
    try {
      this.logger.log(`Buscando grupos do usuário: ${userId}`);
      const groups = await this.groupService.getUserGroups(userId);
      return {
        success: true,
        data: groups,
        message: 'Grupos encontrados',
      };
    } catch (error) {
      this.logger.error(`Erro na rota getUserGroups: ${error.message}`);
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
   * GET /group/:id
   * Busca um grupo por ID
   */
  @Get(':id')
  async getGroupById(@Param('id') id: string) {
    try {
      this.logger.log(`Buscando grupo por ID: ${id}`);
      const group = await this.groupService.getGroupById(id);
      return {
        success: true,
        data: group,
        message: 'Grupo encontrado',
      };
    } catch (error) {
      this.logger.error(`Erro na rota getGroupById: ${error.message}`);
      if (error.message.includes('não encontrado')) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
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
   * POST /group/invite/accept
   * Aceita um convite por token
   */
  @Post('invite/accept')
  async acceptInvite(
    @Body() body: { token: string; userId: string },
  ) {
    try {
      this.logger.log(`Aceitando convite para usuário: ${body.userId}`);
      const group = await this.groupService.acceptInvite(body.token, body.userId);
      return {
        success: true,
        data: group,
        message: 'Convite aceito com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro na rota acceptInvite: ${error.message}`);
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
   * GET /group/invite/validate/:token
   * Valida um convite por token
   */
  @Get('invite/validate/:token')
  async validateInvite(@Param('token') token: string) {
    try {
      this.logger.log(`Validando convite: ${token}`);
      const validation = await this.groupService.validateInvite(token);
      return {
        success: validation.isValid,
        data: validation,
        message: validation.isValid ? 'Convite válido' : validation.message,
      };
    } catch (error) {
      this.logger.error(`Erro na rota validateInvite: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 