import { Injectable } from '@nestjs/common';
import { Log } from 'src/entities/log/log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log) private readonly logRepository: Repository<Log>,
  ) {}

  async writeLog(
    exception: unknown,
    user: Record<string, any>,
  ): Promise<number> {
    const customException = exception as any;
    const log = new Log();

    log.generatedBy = user ? user.id : null;

    log.detail = `${customException?.response?.error}`;
    log.general = `${exception}`;

    const result = await this.logRepository.save(log);

    return result.id;
  }

  async writeExceptionLog(
    exception: unknown,
    user: Record<string, any>,
  ): Promise<number> {
    const customException = exception as any;
    const log = new Log();

    log.generatedBy = user ? user.id : null;

    log.detail = `${customException?.response?.error}`;
    log.general = `${JSON.stringify(exception)}`;

    const result = await this.logRepository.save(log);

    return result.id;
  }
}
