import { pruneGetRequestBody } from './pruneGetRequestBody'
import type { IncomingWorkerRequest } from './workerChannel'

/**
 * Converts a given request received from the Service Worker
 * into a Fetch `Request` instance.
 */
export function deserializeRequest(
  serializedRequest: IncomingWorkerRequest,
): Request {
  return new Request(serializedRequest.url, {
    ...serializedRequest,
    // A fetch request cannot be constructed with the mode 'navigate'
    // therefore we need to set it to undefined when we reconstruct it from
    // the worker's message
    mode:
      serializedRequest.mode !== 'navigate'
        ? serializedRequest.mode
        : undefined,
    body: pruneGetRequestBody(serializedRequest),
  })
}
