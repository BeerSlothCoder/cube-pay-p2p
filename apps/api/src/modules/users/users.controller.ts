import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@cubepay/auth';
import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from '@cubepay/shared-types';
import { Request as ExpressRequest } from 'express';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Register new user — no PII stored, only phone hash + role */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Get own profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: ExpressRequest & { user: { sub: string } }) {
    return this.usersService.findById(req.user.sub);
  }
}
