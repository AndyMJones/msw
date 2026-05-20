import { HttpServer } from '@open-draft/test-server/lib/http.js'
import { test, expect } from '../playwright.extend'

declare namespace window {
  export const msw: {
    worker: import('msw/browser').SetupWorkerApi
    http: typeof import('msw').http
    HttpResponse: typeof import('msw').HttpResponse
  }
}

const server = new HttpServer((app) => {
  app.get('*', (req, res) => {
    res.status(200).send(`Hello from Server`)
  })
})

test.beforeEach(async () => {
  await server.listen()
})

test.afterEach(async () => {
  await server.close()
})

test('allows form submissions to be mocked', async ({
  loadExample,
  page,
  makeUrl,
}) => {
  const navigateURL = makeUrl('/navigate-endpoint')

  await loadExample(new URL('./navigate.mocks.ts', import.meta.url), {
    markup: `<!doctype html>
<html>
  <body>
    <form action="${navigateURL}" method="POST">
      <button type="submit">Submit Form</button>
    </form>
  </body>
</html>
`,
  })

  await page.evaluate((navigateURL) => {
    const { worker, http, HttpResponse } = window.msw

    worker.use(
      http.post(navigateURL, () => {
        return HttpResponse.text('Hello from MSW')
      }),
    )
  }, navigateURL)

  const submitButton = page.getByRole('button', {
    name: /submit form/i,
  })

  const [response] = await Promise.all([
    page.waitForResponse(navigateURL),
    submitButton.click(),
  ])

  const body = await response.text()

  expect(response.fromServiceWorker()).toBe(true)
  expect(body).toEqual('Hello from MSW')
})

test('does not block apps loading their index file by default', async ({
  loadExample,
  page,
}) => {
  const navigateURL = server.http.url('/index.html')

  await loadExample(new URL('./navigate.mocks.ts', import.meta.url), {
    markup: `<!doctype html>
<html>
  <body>
    <a href="${navigateURL}">Home</a>
  </body>
</html>
`,
  })

  const submitButton = page.getByRole('link', {
    name: /home/i,
  })

  const [response] = await Promise.all([
    page.waitForResponse(navigateURL),
    submitButton.click(),
  ])

  const body = await response.text()

  expect(response.fromServiceWorker()).toBe(false)
  expect(body).toEqual('Hello from Server')
})
