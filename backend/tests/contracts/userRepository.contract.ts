import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../src/domain/errors';
import { UserRepository } from '../../src/repositories/UserRepository';

/**
 * Behaviour every UserRepository must have, whatever it stores data in.
 * Run against the in-memory fake AND real Postgres, so the fake used by the
 * fast tests is proven to match the real thing.
 */
export function describeUserRepositoryContract(name: string, makeRepository: () => Promise<UserRepository>) {
  describe(`${name} satisfies the UserRepository contract`, () => {
    let repo: UserRepository;
    const data = { email: 'ada@example.com', passwordHash: '$2a$04$hash', role: 'user' as const };

    beforeEach(async () => {
      repo = await makeRepository();
    });

    it('creates a user with a generated id and timestamp', async () => {
      const user = await repo.create(data);

      expect(user).toEqual({ ...data, id: expect.any(String), createdAt: expect.any(Date) });
    });

    it('finds a user by email and by id', async () => {
      const created = await repo.create(data);

      expect(await repo.findByEmail('ada@example.com')).toEqual(created);
      expect(await repo.findById(created.id)).toEqual(created);
    });

    it('returns null for unknown email or id', async () => {
      expect(await repo.findByEmail('ghost@example.com')).toBeNull();
      expect(await repo.findById(randomUUID())).toBeNull();
    });

    it('rejects a duplicate email with ConflictError', async () => {
      await repo.create(data);

      await expect(repo.create(data)).rejects.toBeInstanceOf(ConflictError);
    });

    it('stores the role it is given', async () => {
      const admin = await repo.create({ ...data, email: 'boss@example.com', role: 'admin' });

      expect((await repo.findById(admin.id))?.role).toBe('admin');
    });
  });
}
