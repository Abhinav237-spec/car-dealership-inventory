import { UnauthorizedError } from '../src/domain/errors';
import { JwtTokenService } from '../src/services/TokenService';

const user = { id: 'user-1', role: 'admin' as const };

describe('JwtTokenService', () => {
  it('round-trips the user id and role', () => {
    const service = new JwtTokenService('secret-a', 60);

    expect(service.verify(service.sign(user))).toEqual(user);
  });

  it('rejects a tampered token', () => {
    const service = new JwtTokenService('secret-a', 60);

    expect(() => service.verify(service.sign(user) + 'x')).toThrow(UnauthorizedError);
  });

  it('rejects a token signed with a different secret', () => {
    const token = new JwtTokenService('secret-a', 60).sign(user);

    expect(() => new JwtTokenService('secret-b', 60).verify(token)).toThrow(UnauthorizedError);
  });

  it('rejects an expired token', () => {
    const service = new JwtTokenService('secret-a', -10); // already expired

    expect(() => service.verify(service.sign(user))).toThrow(UnauthorizedError);
  });
});
