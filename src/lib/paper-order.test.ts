import test from 'node:test'
import assert from 'node:assert/strict'
import { preparePaperOrder } from './paper-order.ts'
import { demoPaperMarket, newPaperWallet } from './paper-trading.ts'

const market = { ...demoPaperMarket().market, demo: false, price: 10, observedAt: 0 }
const costs = { feePercent: 0, slippagePercent: 0, fixedFee: 0 }
test('executes at the newly fetched quote, using wallet balance at response time', async () => {
  const wallet = newPaperWallet()
  const result = await preparePaperOrder(() => ({ ...wallet, cash: 200 }), market, 'buy', 100, costs, '', new AbortController().signal, async () => ({ ...market, price: 20, observedAt: Date.now() }))
  assert.equal(result.wallet.cash, 100); assert.equal(result.wallet.positions[0].quantity, 5)
  assert.equal(wallet.cash, 10_000)
})
test('quote failure, cancellation or mismatched pool cannot debit the wallet', async () => {
  const wallet = newPaperWallet(), controller = new AbortController()
  await assert.rejects(preparePaperOrder(() => wallet, market, 'buy', 100, costs, '', controller.signal, async () => { throw new Error('offline') }), /offline/)
  controller.abort()
  await assert.rejects(preparePaperOrder(() => wallet, market, 'buy', 100, costs, '', controller.signal, async () => ({ ...market, observedAt: Date.now() })), { name: 'AbortError' })
  await assert.rejects(preparePaperOrder(() => wallet, market, 'buy', 100, costs, '', new AbortController().signal, async () => ({ ...market, pair: 'other', observedAt: Date.now() })), /não corresponde/)
  assert.equal(wallet.cash, 10_000); assert.equal(wallet.trades.length, 0)
})
