import { vi } from 'vitest'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore dispose polyfill
Symbol.dispose ??= Symbol.for('Symbol.dispose')
// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore dispose polyfill
Symbol.asyncDispose ??= Symbol.for('Symbol.asyncDispose')

process.env.MONOWEAVE_DISABLE_LOGS = '1'

vi.mock('@monoweave/git')
vi.mock('@yarnpkg/plugin-npm')
