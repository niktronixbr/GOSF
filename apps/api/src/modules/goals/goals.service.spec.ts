import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { DatabaseService } from '../../common/database/database.service';

const mockDb = {
  student: { findUnique: jest.fn() },
  studentGoal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const student = { id: 'student-1', userId: 'user-1' };
const goal = {
  id: 'goal-1',
  studentId: 'student-1',
  title: 'Estudar álgebra',
  description: null,
  status: 'PENDING',
  dueDate: null,
  completedAt: null,
  createdAt: new Date(),
};

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  describe('findAll', () => {
    it('retorna metas do aluno', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findMany.mockResolvedValue([goal]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(mockDb.studentGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 'student-1' } }),
      );
    });

    it('lança ForbiddenException quando perfil de aluno não existe', async () => {
      mockDb.student.findUnique.mockResolvedValue(null);

      await expect(service.findAll('user-sem-perfil')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('cria meta para o aluno', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.create.mockResolvedValue(goal);

      const result = await service.create('user-1', { title: 'Estudar álgebra' });

      expect(result.title).toBe('Estudar álgebra');
      expect(mockDb.studentGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ studentId: 'student-1', title: 'Estudar álgebra' }),
        }),
      );
    });

    it('cria meta com data de vencimento', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.create.mockResolvedValue({ ...goal, dueDate: new Date('2026-12-31') });

      const result = await service.create('user-1', { title: 'Meta com prazo', dueDate: '2026-12-31' });

      expect(mockDb.studentGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dueDate: expect.any(Date) }),
        }),
      );
    });

    it('lança ForbiddenException quando perfil de aluno não existe', async () => {
      mockDb.student.findUnique.mockResolvedValue(null);

      await expect(service.create('user-sem-perfil', { title: 'Meta' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('atualiza título da meta', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue(goal);
      mockDb.studentGoal.update.mockResolvedValue({ ...goal, title: 'Novo título' });

      const result = await service.update('user-1', 'goal-1', { title: 'Novo título' });

      expect(result.title).toBe('Novo título');
    });

    it('define completedAt quando status muda para DONE', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue({ ...goal, status: 'PENDING' });
      mockDb.studentGoal.update.mockResolvedValue({ ...goal, status: 'DONE', completedAt: new Date() });

      await service.update('user-1', 'goal-1', { status: 'DONE' as any });

      expect(mockDb.studentGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });

    it('remove completedAt quando status muda de DONE para outro', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue({ ...goal, status: 'DONE', completedAt: new Date() });
      mockDb.studentGoal.update.mockResolvedValue({ ...goal, status: 'PENDING', completedAt: null });

      await service.update('user-1', 'goal-1', { status: 'PENDING' as any });

      expect(mockDb.studentGoal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: null }),
        }),
      );
    });

    it('lança NotFoundException quando meta não existe', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue(null);

      await expect(service.update('user-1', 'goal-inexistente', {})).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException quando meta pertence a outro aluno', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue({ ...goal, studentId: 'outro-student' });

      await expect(service.update('user-1', 'goal-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('remove meta com sucesso', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue(goal);
      mockDb.studentGoal.delete.mockResolvedValue(goal);

      const result = await service.remove('user-1', 'goal-1');

      expect(result).toEqual({ deleted: true });
      expect(mockDb.studentGoal.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
    });

    it('lança NotFoundException quando meta não existe', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue(null);

      await expect(service.remove('user-1', 'goal-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException quando meta pertence a outro aluno', async () => {
      mockDb.student.findUnique.mockResolvedValue(student);
      mockDb.studentGoal.findUnique.mockResolvedValue({ ...goal, studentId: 'outro-student' });

      await expect(service.remove('user-1', 'goal-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
