import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators';
import { Role } from '@prisma/client';

import { AdminUsersService } from './admin-users.service'
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { Protected } from 'src/common/decorators';

@Controller('admin/users')
@Protected()
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll(@Query() query: AdminUsersQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/block')
  async block(@Param('id') id: string) {
    return this.adminUsersService.blockUser(id);
  }

  @Patch(':id/unblock')
  async unblock(@Param('id') id: string) {
    return this.adminUsersService.unblockUser(id);
  }
}