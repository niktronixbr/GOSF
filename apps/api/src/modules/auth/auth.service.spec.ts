import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../common/database/database.service';
import { MailService } from '../../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';

const mockDb = {
  institution: { findUnique: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  passwordResetToken: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockJwt = { sign: jest.fn() };
const mockConfig = { getOrThrow: jest.fn(), get: jest.fn() };
const mockMail = { sendPasswordReset: jest.fn() };
const mockAudit = { log: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: MailService, useValue: mockMail },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    const institution = { id: 'inst-1' };
    const user = {
      id: 'user-1',
      email: 'a@b.com',
      fullName: 'Aluno',
      role: 'STUDENT',
      institutionId: 'inst-1',
      status: 'ACTIVE',
      passwordHash: '',
    };

    beforeEach(async () => {
      user.passwordHash = await bcrypt.hash('senha123', 10);
    });

    it('retorna usuário quando credenciais são válidas', async () => {
      mockDb.institution.findUnique.mockResolvedValue(institution);
      mockDb.user.findUnique.mockResolvedValue(user);
      mockDb.user.update.mockResolvedValue(user);

      const result = await service.validateUser('a@b.com', 'senha123', 'escola-demo');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('a@b.com');
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it('lança UnauthorizedException quando instituição não existe', async () => {
      mockDb.institution.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('a@b.com', 'senha123', 'slug-errado')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando senha está errada', async () => {
      mockDb.institution.findUnique.mockResolvedValue(institution);
      mockDb.user.findUnique.mockResolvedValue(user);

      await expect(service.validateUser('a@b.com', 'senha-errada', 'escola-demo')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando usuário não existe', async () => {
      mockDb.institution.findUnique.mockResolvedValue(institution);
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('inexistente@b.com', 'senha123', 'escola-demo')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando conta está inativa', async () => {
      mockDb.institution.findUnique.mockResolvedValue(institution);
      mockDb.user.findUnique.mockResolvedValue({ ...user, status: 'INACTIVE' });

      await expect(service.validateUser('a@b.com', 'senha123', 'escola-demo')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    const user = { id: 'user-1', email: 'a@b.com', fullName: 'Aluno', role: 'STUDENT', institutionId: 'inst-1' };

    it('retorna accessToken e refreshToken', async () => {
      mockJwt.sign.mockReturnValue('token-jwt');
      mockConfig.getOrThrow.mockReturnValue('refresh-secret');
      mockConfig.get.mockReturnValue('7d');
      mockDb.refreshToken.create.mockResolvedValue({});

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockDb.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('registra log de auditoria', async () => {
      mockJwt.sign.mockReturnValue('token-jwt');
      mockConfig.getOrThrow.mockReturnValue('refresh-secret');
      mockConfig.get.mockReturnValue('7d');
      mockDb.refreshToken.create.mockResolvedValue({});

      await service.login(user);

      expect(mockAudit.log).toHaveBeenCalledWith('inst-1', 'LOGIN', 'User', expect.any(Object));
    });
  });

  describe('refresh', () => {
    const storedToken = {
      id: 'rt-1',
      token: 'refresh-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
      user: { id: 'user-1', email: 'a@b.com', fullName: 'Aluno', role: 'STUDENT', institutionId: 'inst-1' },
    };

    it('revoga token antigo e retorna novos tokens', async () => {
      mockDb.refreshToken.findUnique.mockResolvedValue(storedToken);
      mockDb.refreshToken.update.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('novo-token');
      mockConfig.getOrThrow.mockReturnValue('refresh-secret');
      mockConfig.get.mockReturnValue('7d');
      mockDb.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('refresh-token');

      expect(mockDb.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' } }),
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('lança UnauthorizedException quando token está revogado', async () => {
      mockDb.refreshToken.findUnique.mockResolvedValue({ ...storedToken, revokedAt: new Date() });

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token está expirado', async () => {
      mockDb.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando token não existe', async () => {
      mockDb.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token-inexistente')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoga o refresh token', async () => {
      mockDb.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('refresh-token');

      expect(mockDb.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: 'refresh-token' } }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('retorna mensagem genérica quando instituição não existe', async () => {
      mockDb.institution.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('a@b.com', 'slug-errado');

      expect(result.message).toContain('Se o e-mail existir');
      expect(mockMail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('retorna mensagem genérica quando usuário não existe', async () => {
      mockDb.institution.findUnique.mockResolvedValue({ id: 'inst-1' });
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('inexistente@b.com', 'escola-demo');

      expect(result.message).toContain('Se o e-mail existir');
    });

    it('envia e-mail e retorna mensagem genérica quando tudo está correto', async () => {
      mockDb.institution.findUnique.mockResolvedValue({ id: 'inst-1' });
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        fullName: 'Aluno',
        status: 'ACTIVE',
      });
      mockDb.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      mockDb.passwordResetToken.create.mockResolvedValue({});
      mockConfig.get.mockReturnValue('http://localhost:3002');
      mockMail.sendPasswordReset.mockResolvedValue(undefined);

      const result = await service.forgotPassword('a@b.com', 'escola-demo');

      expect(result.message).toContain('Se o e-mail existir');
      expect(mockMail.sendPasswordReset).toHaveBeenCalledWith(
        'a@b.com',
        'Aluno',
        expect.stringContaining('/reset-password?token='),
      );
    });
  });

  describe('resetPassword', () => {
    const resetRecord = {
      id: 'pr-1',
      userId: 'user-1',
      token: 'reset-token',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
      user: { id: 'user-1' },
    };

    it('redefine a senha com sucesso', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(resetRecord);
      mockDb.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword('reset-token', 'NovaSenha@123');

      expect(result.message).toContain('sucesso');
      expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    });

    it('lança BadRequestException quando token está expirado', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue({
        ...resetRecord,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.resetPassword('reset-token', 'NovaSenha@123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança BadRequestException quando token já foi usado', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue({
        ...resetRecord,
        usedAt: new Date(),
      });

      await expect(service.resetPassword('reset-token', 'NovaSenha@123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança BadRequestException quando token não existe', async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('token-inexistente', 'NovaSenha@123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
