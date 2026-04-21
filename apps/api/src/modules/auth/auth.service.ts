import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    // TODO: verify OTP (phone/email) via Sumsub or own OTP service
    // For now: returns tokens after OTP verification stub
    const userId = await this.verifyOtp(dto.phone, dto.otp);

    const payload = { sub: userId, phone: dto.phone, role: dto.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const { sub, phone, role } = payload as { sub: string; phone: string; role: string };
      const accessToken = this.jwtService.sign({ sub, phone, role }, { expiresIn: '15m' });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async verifyOtp(phone: string, otp: string): Promise<string> {
    // TODO: integrate Sumsub OTP or Twilio Verify
    // Stub: returns deterministic userId
    if (!phone || !otp) throw new UnauthorizedException('Invalid credentials');
    return `user_${Buffer.from(phone).toString('hex').slice(0, 16)}`;
  }
}
