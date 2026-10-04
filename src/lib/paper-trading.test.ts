/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { demoPaperMarket, executePaperTrade, newPaperWallet, paperFill, restorePaperWallet, markPaperWallet, type PaperCosts } from './paper-trading.ts'

const costs: PaperCosts = { feePercent: 0.3, slippagePercent: 1, fixedFee: 2 }
const market = { ...demoPaperMarket().market, price: 10 }

test('changing liquidity pool preserves token holdings, cost basis and sell availability', () => {
  const first = { ...market, demo: false, id: 'solana:token:pool1', pair: 'pool1', observedAt: Date.now() }
  const second = { ...first, id: 'solana:token:pool2', pair: 'pool2', price: 12 }
  const fees = { feePercent: 0, slippagePercent: 0, fixedFee: 0 }
  const bought = executePaperTrade(newPaperWallet(), first, 'buy', 100, fees)
  const marked = markPaperWallet(bought, second)
  assert.equal(marked.positions.length, 1); assert.equal(marked.positions[0].quantity, 10); assert.equal(marked.positions[0].cost, 100)
  const added = executePaperTrade(marked, second, 'buy', 120, fees)
  assert.equal(added.positions.length, 1); assert.equal(added.positions[0].quantity, 20); assert.equal(added.positions[0].cost, 220)
  const sold = executePaperTrade(added, first, 'sell', 20, fees)
  assert.equal(sold.positions.length, 0); assert.equal(sold.trades[0].pnl, -20)
})

test('buy budget includes fixed fee, percentage fee and adverse slippage', () => {
  const fill = paperFill('buy', 10, 100, costs)
  assert.equal(fill.price, 10.1)
  assert.ok(Math.abs(fill.net - 100) < 1e-10)
  assert.ok(Math.abs(fill.quantity * 10.1 + fill.fee - 100) < 1e-10)
  assert.ok(fill.quantity < 10)
})
test('partial sales allocate entry costs proportionally and preserve remaining basis', () => {
  const bought = executePaperTrade(newPaperWallet(), market, 'buy', 1000, costs)
  const quantity = bought.positions[0].quantity
  const sold = executePaperTrade(bought, { ...market, price: 12 }, 'sell', quantity / 2, costs)
  assert.ok(Math.abs(sold.positions[0].cost - 500) < 1e-9)
  assert.ok(Math.abs(sold.positions[0].quantity - quantity / 2) < 1e-9)
  assert.ok(Math.abs(sold.trades[0].pnl! - (sold.trades[0].net - 500)) < 1e-9)
  const closed = executePaperTrade(sold, market, 'sell', sold.positions[0].quantity, costs)
  assert.equal(closed.positions.length, 0)
})
test('flat-price round trip loses entry and exit costs, not twice-applied quantities', () => {
  const bought = executePaperTrade(newPaperWallet(), market, 'buy', 1000, costs)
  const closed = executePaperTrade(bought, market, 'sell', bought.positions[0].quantity, costs)
  assert.ok(closed.cash < 10000)
  assert.ok(closed.trades[0].pnl! < 0)
  assert.ok(Math.abs(closed.cash - 10000 - closed.trades[0].pnl!) < 1e-9)
})
test('overspending and overselling are rejected without mutating original wallet', () => {
  const wallet = newPaperWallet()
  assert.throws(() => executePaperTrade(wallet, market, 'buy', 10001, costs), /Saldo/)
  assert.throws(() => executePaperTrade(wallet, market, 'sell', 1, costs), /Quantidade/)
  assert.equal(wallet.cash, 10000)
  const bought = executePaperTrade(wallet, market, 'buy', 100, costs)
  assert.throws(() => executePaperTrade(bought, market, 'sell', bought.positions[0].quantity * 1.01, costs), /Quantidade/)
})
test('old live quotes cannot produce fills and demo quotes are explicitly distinct', () => {
  assert.throws(() => executePaperTrade(newPaperWallet(), { ...market, demo: false, observedAt: Date.now() - 100000 }, 'buy', 100, costs), /Atualize/)
  assert.doesNotThrow(() => executePaperTrade(newPaperWallet(), { ...market, observedAt: Date.now() - 100000 }, 'buy', 100, costs))
})
test('invalid costs and budgets cannot create negative or nonfinite balances', () => {
  for (const value of [NaN, Infinity, 0, -1]) assert.throws(() => paperFill('buy', 10, value, costs))
  assert.throws(() => paperFill('buy', 10, 1, costs))
  assert.throws(() => paperFill('sell', 10, 0.01, costs))
  assert.throws(() => paperFill('buy', 10, 100, { ...costs, slippagePercent: 100 }))
})
test('wallet survives serialization, but malformed or corrupted data is reset safely', () => {
  const bought = executePaperTrade(newPaperWallet(), market, 'buy', 100, costs)
  assert.deepEqual(restorePaperWallet(JSON.stringify(bought)), bought)
  assert.deepEqual(restorePaperWallet('{bad'), newPaperWallet())
  assert.deepEqual(restorePaperWallet(JSON.stringify({ ...bought, cash: -1 })), newPaperWallet())
  assert.deepEqual(restorePaperWallet(JSON.stringify({ ...bought, positions: [null] })), newPaperWallet())
})
