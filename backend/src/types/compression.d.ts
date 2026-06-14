declare module 'compression' {
  import { RequestHandler } from 'express';
  function compression(options?: unknown): RequestHandler;
  export default compression;
}
