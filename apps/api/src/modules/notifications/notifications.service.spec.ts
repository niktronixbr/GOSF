import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { DatabaseService } from '../../common/database/database.service';

const mockDb = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
};

const notification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'GOAL_REMINDER',
  title: 'Lembrete de meta',
  body: 'Você tem uma meta pendente.',
  data: null,
  readAt: null,
  createdAt: new Date(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('retorna notificações do usuário (máx 30)', async () => {
      mockDb.notification.findMany.mockResolvedValue([notification]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(mockDb.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          take: 30,
        }),
      );
    });
  });

  describe('countUnread', () => {
    it('retorna contagem de notificações não lidas', async () => {
      mockDb.notification.count.mockResolvedValue(5);

      const result = await service.countUnread('user-1');

      expect(result).toEqual({ count: 5 });
      expect(mockDb.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
      });
    });

    it('retorna zero quando todas foram lidas', async () => {
      mockDb.notification.count.mockResolvedValue(0);

      const result = await service.countUnread('user-1');

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markRead', () => {
    it('marca notificação como lida', async () => {
      mockDb.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markRead('notif-1', 'user-1');

      expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllRead', () => {
    it('marca todas as notificações do usuário como lidas', async () => {
      mockDb.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllRead('user-1');

      expect(mockDb.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('create', () => {
    it('cria notificação e notifica subscribers ativos', async () => {
      mockDb.notification.create.mockResolvedValue(notification);
      const callback = jest.fn();
      service.subscribe('user-1', callback);

      await service.create('user-1', 'GOAL_REMINDER' as any, 'Lembrete', 'Corpo da mensagem');

      expect(mockDb.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            type: 'GOAL_REMINDER',
            title: 'Lembrete',
            body: 'Corpo da mensagem',
          }),
        }),
      );
      expect(callback).toHaveBeenCalledWith(notification);
    });

    it('cria notificação sem chamar callback quando não há subscribers', async () => {
      mockDb.notification.create.mockResolvedValue(notification);

      await expect(
        service.create('user-sem-subscriber', 'GOAL_REMINDER' as any, 'Título', 'Corpo'),
      ).resolves.not.toThrow();
    });

    it('cria notificação com data extra (campo data)', async () => {
      const extra = { goalId: 'goal-1' };
      mockDb.notification.create.mockResolvedValue({ ...notification, data: extra });

      await service.create('user-1', 'GOAL_REMINDER' as any, 'Título', 'Corpo', extra);

      expect(mockDb.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ data: extra }),
        }),
      );
    });
  });

  describe('subscribe', () => {
    it('registra e desregistra subscriber corretamente', () => {
      const callback = jest.fn();

      const unsubscribe = service.subscribe('user-1', callback);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      // Após unsubscribe, callback não deve ser chamado ao criar notificação
      mockDb.notification.create.mockResolvedValue(notification);
      service.create('user-1', 'GOAL_REMINDER' as any, 'T', 'B');

      // callback já foi removido — não deve ser invocado
      expect(callback).not.toHaveBeenCalled();
    });

    it('suporta múltiplos subscribers para o mesmo usuário', async () => {
      mockDb.notification.create.mockResolvedValue(notification);
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      service.subscribe('user-1', cb1);
      service.subscribe('user-1', cb2);

      await service.create('user-1', 'GOAL_REMINDER' as any, 'T', 'B');

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });
});
