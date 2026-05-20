import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'

const worker = setupWorker()

worker.start()

Object.assign(window, {
  msw: {
    worker,
    http,
    HttpResponse,
  },
})
