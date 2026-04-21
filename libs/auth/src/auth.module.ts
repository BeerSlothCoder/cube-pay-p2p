import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
          issuer: 'cubepay',
          audience: 'cubepay-api',
        },
      }),
    }),
  ],
  providers: [JwtAuthGuard, ApiKeyGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, ApiKeyGuard, RolesGuard],
})
export class AuthModule {}
