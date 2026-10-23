import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// Uses the local Chromium installation, without adding browser dependencies.
const browserPath = process.env.CHOUSE_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const baseUrl = process.env.CHOUSE_URL || 'http://127.0.0.1:5173'
const output = resolve('.artifacts')
const profile = await mkdtemp(join(tmpdir(), 'chouse-browser-'))
await mkdir(output, { recursive: true })
const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let socket
const pending = new Map()
let commandId = 0
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value) }, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + ' ' + response.exceptionDetails.exception?.description)
  return response.result.value
}
async function waitFor(expression) {
  for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await delay(100) }
  console.log(await evaluate('({ url: location.href, text: document.body.innerText.slice(0, 2500), html: document.documentElement.outerHTML.slice(0, 1000) })'))
  await screenshot('failure')
  throw new Error(`Condition not met: ${expression}`)
}
async function click(text) {
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)}); button.click() })()`)
  await delay(100)
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(join(output, `${name}.png`), Buffer.from(data, 'base64'))
}
async function viewport(width, height = 1000) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await delay(100)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `Horizontal overflow at ${width}px`)
}

try {
  let tabs
  for (let i = 0; i < 80; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:9333/json')).json(); break } catch { await delay(100) }
  }
  assert.ok(tabs?.length, 'Headless browser started')
  const tab = tabs.find(item => item.type === 'page' && item.url === 'about:blank') || tabs.find(item => item.type === 'page')
  assert.ok(tab, 'A browser page is available')
  socket = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  const runtimeErrors = []
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') { runtimeErrors.push(message.params.exceptionDetails.text); console.log('Browser exception:', message.params.exceptionDetails.exception?.description) }
    const entry = pending.get(message.id)
    if (entry) { pending.delete(message.id); if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result) }
  }
  await send('Page.enable'); await send('Runtime.enable')
  await viewport(1440)
  await send('Page.navigate', { url: baseUrl })
  await waitFor('document.querySelectorAll(".poll-card").length === 6')
  await evaluate('document.fonts.ready')
  await screenshot('desktop')
  assert.equal(await evaluate('document.documentElement.lang'), 'pt-BR')
  await evaluate('document.querySelector(".duel-option").click()')
  await waitFor('Boolean(document.querySelector("dialog[open]"))')
  assert.match(await evaluate('document.querySelector("dialog").innerText'), /Entrar ou criar conta/)
  await click('Experimentar a demonstração')
  await waitFor('Boolean(document.querySelector(".demo-notice"))')
  await evaluate('document.querySelector(".duel-option").click()')
  await click('Confirmar meu voto')
  assert.match(await evaluate('document.querySelector("dialog").innerText'), /Voto registrado/)
  assert.equal(await evaluate('document.querySelectorAll(".result-bars").length'), 0, 'Voting never reveals percentages')
  await click('Testar minha intuição')
  assert.equal(await evaluate('document.querySelector(".duel-option").disabled'), false, 'Vote does not consume the guess')
  await evaluate('document.querySelectorAll(".duel-option")[1].click()')
  await click('Confirmar meu palpite')
  assert.match(await evaluate('document.querySelector("dialog").innerText'), /10 pontos/)
  assert.equal(await evaluate('document.querySelectorAll(".result-bars").length'), 1)
  await screenshot('guess-result')
  await click('Continuar jogando')
  assert.equal(await evaluate('document.querySelector(".duel-option").disabled'), true, 'Duplicate guesses disabled')
  await click('Ver resultado')
  assert.equal(await evaluate('document.querySelectorAll(".result-bars").length'), 1, 'Previous guess results can be revisited')
  await click('Continuar jogando')
  await click('Comida')
  assert.equal(await evaluate('document.querySelectorAll(".poll-card").length'), 2)
  await evaluate(`(() => { const input = document.querySelector('.search-field input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'pizza'); input.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  await waitFor('document.querySelectorAll(".poll-card").length === 1')
  await evaluate('document.querySelector(".search-field button").click()')
  await click('Minha jornada')
  assert.equal(await evaluate('document.querySelector(".stats-grid strong").textContent'), '10')
  assert.equal(await evaluate('document.querySelectorAll(".history-row").length'), 1)
  await screenshot('journey')
  await click('Descobrir')
  for (const width of [1280, 1024, 768, 540, 390, 360]) await viewport(width, 900)
  await viewport(390, 844)
  await screenshot('mobile')
  await evaluate('document.querySelector(".mobile-menu").click()')
  assert.equal(await evaluate('document.querySelector(".sidebar").classList.contains("is-open")'), true)
  await click('Minha jornada')
  assert.equal(await evaluate('document.querySelector(".sidebar").classList.contains("is-open")'), false)
  await screenshot('mobile-journey')
  await send('Page.reload')
  await waitFor('document.querySelectorAll(".poll-card").length === 6')
  await click('Experimentar demo')
  await evaluate('document.querySelector(".mobile-menu").click()')
  await click('Minha jornada')
  assert.equal(await evaluate('document.querySelector(".stats-grid strong").textContent'), '10', 'Demo persists for the browser session')
  assert.deepEqual(runtimeErrors, [], 'No runtime exceptions')
  console.log('PASS: guest login gate, demo vote secrecy, independent guesses, points, duplicate prevention, filters, search, journey, session persistence, mobile menu, and responsive widths 360–1440px.')
  console.log(`Screenshots: ${output}`)
} finally {
  socket?.close()
  browser.kill()
  await delay(500)
  // profile is created under the system temp directory for this run only.
  if (profile.startsWith(join(tmpdir(), 'chouse-browser-'))) await rm(profile, { recursive: true, force: true }).catch(() => {})
}
