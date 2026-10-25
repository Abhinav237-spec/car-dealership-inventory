import { describeUserRepositoryContract } from '../contracts/userRepository.contract';
import { describeVehicleRepositoryContract } from '../contracts/vehicleRepository.contract';
import { InMemoryUserRepository } from '../support/InMemoryUserRepository';
import { InMemoryVehicleRepository } from '../support/InMemoryVehicleRepository';

// The fakes used by the fast HTTP tests must obey the same contract as Postgres.
describeUserRepositoryContract('InMemoryUserRepository', async () => new InMemoryUserRepository());
describeVehicleRepositoryContract('InMemoryVehicleRepository', async () => new InMemoryVehicleRepository());
