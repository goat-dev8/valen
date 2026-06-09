import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VENDOR_QUEUE } from '../../common/constants/queues.constant';

@Processor(VENDOR_QUEUE)
export class VendorProcessor extends WorkerHost {
  private readonly logger = new Logger(VendorProcessor.name);

  async process(job: Job<{ provider: string; payloadRef: string }>) {
    this.logger.log(`Processing vendor job ${job.id} for ${job.data.provider}`);
  }
}
