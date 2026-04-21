import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { DatabaseService } from '../../common/database/database.service';
import { AuditService } from '../audit/audit.service';

const mockDb = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  student: { create: jest.fn() },
  teacher: { create: jest.fn() },
  refreshToken: { deleteMany: jest.fn() },
};

const mockAudit = { log: jest.fn() };

const baseUser = {
  id: 'user-1',
  email: 'a@b.com',
  fullName: 'Aluno Teste',
  role: 'STUDENT',
  status: 'ACTIVE',
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date(),
  institutionId: 'inst-1',
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('retorna usuário quando encontrado', async () => {
      mockDb.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
    });

    it('lança NotFoundException quando usuário não existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByInstitution', () => {
    it('retorna lista paginada de usuários', async () => {
      mockDb.user.findMany.mockResolvedValue([baseUser]);
      mockDb.user.count.mockResolvedValue(1);

      const result = await service.findByInstitution('inst-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('aplica filtro de busca por nome/email', async () => {
      mockDb.user.findMany.mockResolvedValue([baseUser]);
      mockDb.user.count.mockResolvedValue(1);

      await service.findByInstitution('inst-1', { search: 'Aluno' });

      expect(mockDb.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('create', () => {
    const dto = { email: 'novo@b.com', fullName: 'Novo Aluno', password: 'Senha@123', role: 'STUDENT' as any };

    it('cria usuário STUDENT e perfil de aluno', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ ...baseUser, email: dto.email });
      mockDb.student.create.mockResolvedValue({});

      const result = await service.create('inst-1', dto);

      expect(result.email).toBe(dto.email);
      expect(mockDb.student.create).toHaveBeenCalledTimes(1);
    });

    it('cria usuário TEACHER e perfil de professor', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ ...baseUser, role: 'TEACHER' });
      mockDb.teacher.create.mockResolvedValue({});

      await service.create('inst-1', { ...dto, role: 'TEACHER' as any });

      expect(mockDb.teacher.create).toHaveBeenCalledTimes(1);
    });

    it('lança ConflictException quando e-mail já existe na instituição', async () => {
      mockDb.user.findFirst.mockResolvedValue(baseUser);

      await expect(service.create('inst-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('atualiza usuário com sucesso', async () => {
      mockDb.user.findUnique.mockResolvedValue(baseUser);
      mockDb.user.update.mockResolvedValue({ ...baseUser, fullName: 'Nome Atualizado' });

      const result = await service.update('user-1', 'inst-1', { fullName: 'Nome Atualizado' });

      expect(result.fullName).toBe('Nome Atualizado');
    });

    it('lança NotFoundException quando usuário não existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(service.update('inexistente', 'inst-1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('atualiza perfil próprio e registra auditoria', async () => {
      mockDb.user.findUnique.mockResolvedValue(baseUser);
      mockDb.user.update.mockResolvedValue({ ...baseUser, fullName: 'Novo Nome' });

      const result = await service.updateMe('user-1', { fullName: 'Novo Nome' });

      expect(result.fullName).toBe('Novo Nome');
      expect(mockAudit.log).toHaveBeenCalledWith('inst-1', 'UPDATE_PROFILE', 'User', expect.any(Object));
    });
  });

  describe('changePassword', () => {
    it('altera senha com sucesso e revoga refresh tokens', async () => {
      const hash = await bcrypt.hash('SenhaAtual@123', 10);
      mockDb.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });
      mockDb.user.update.mockResolvedValue(baseUser);
      mockDb.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.changePassword('user-1', {
        currentPassword: 'SenhaAtual@123',
        newPassword: 'NovaSenha@123',
      });

      expect(mockDb.user.update).toHaveBeenCalledTimes(1);
      expect(mockDb.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });

    it('lança UnauthorizedException quando senha atual está errada', async () => {
      const hash = await bcrypt.hash('SenhaCorreta@123', 10);
      mockDb.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'SenhaErrada@123',
          newPassword: 'NovaSenha@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança BadRequestException quando nova senha é igual à atual', async () => {
      const hash = await bcrypt.hash('SenhaIgual@123', 10);
      mockDb.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'SenhaIgual@123',
          newPassword: 'SenhaIgual@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança NotFoundException quando usuário não existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('inexistente', {
          currentPassword: 'Senha@123',
          newPassword: 'Nova@123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('alterna status de ACTIVE para INACTIVE', async () => {
      mockDb.user.findUnique.mockResolvedValue(baseUser);
      mockDb.user.update.mockResolvedValue({ ...baseUser, status: 'INACTIVE' });

      const result = await service.toggleStatus('user-1', 'inst-1');

      expect(result.status).toBe('INACTIVE');
      expect(mockAudit.log).toHaveBeenCalledWith('inst-1', 'USER_INACTIVE', 'User', expect.any(Object));
    });

    it('alterna status de INACTIVE para ACTIVE', async () => {
      mockDb.user.findUnique.mockResolvedValue({ ...baseUser, status: 'INACTIVE' });
      mockDb.user.update.mockResolvedValue({ ...baseUser, status: 'ACTIVE', institutionId: 'inst-1' });

      const result = await service.toggleStatus('user-1', 'inst-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('lança NotFoundException quando usuário não existe na instituição', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      await expect(service.toggleStatus('user-1', 'inst-errada')).rejects.toThrow(NotFoundException);
    });
  });
});
