import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INDEXER_QUEUE } from '../../common/constants/queues.constant';
import { DatabaseService } from '../../database/database.service';

@Processor(INDEXER_QUEUE)
export class IndexerProcessor extends WorkerHost {
  private readonly logger = new Logger(IndexerProcessor.name);

  constructor(private readonly db: DatabaseService) {
    super();
  }

  async process(job: Job<{ chainId: number; fromBlock: number; toBlock: number }>) {
    this.logger.log(
      `Indexing chain ${job.data.chainId} blocks ${job.data.fromBlock}-${job.data.toBlock}`,
    );
    await this.db.query('SELECT 1');
  }
}
