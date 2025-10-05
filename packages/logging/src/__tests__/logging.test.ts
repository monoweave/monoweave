import { type MessageName, ThrowReport } from '@yarnpkg/core'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import logging, { LOG_LEVELS } from '..'

class CollectReport extends ThrowReport {
    reportInfo(name: MessageName | null, text: string) {
        console.log(text)
    }

    reportWarning(name: MessageName, text: string) {
        console.warn(text)
    }

    reportError(name: MessageName, text: string) {
        console.error(text)
    }

    reportExceptionOnce(error: Error) {
        console.error(error)
    }
}

describe('Logging', () => {
    const origLogLevel = process.env.MONOWEAVE_LOG_LEVEL

    let report: CollectReport

    beforeAll(() => {
        vi.spyOn(console, 'log').mockImplementation(() => void 0)
        vi.spyOn(console, 'warn').mockImplementation(() => void 0)
        vi.spyOn(console, 'error').mockImplementation(() => void 0)
    })

    beforeEach(() => {
        report = new CollectReport()
    })

    afterEach(() => {
        vi.clearAllMocks()
        if (origLogLevel === undefined) {
            delete process.env.MONOWEAVE_LOG_LEVEL
        } else {
            process.env.MONOWEAVE_LOG_LEVEL = origLogLevel
        }
        logging.setDryRun(false)
    })

    it('respects log level', () => {
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.DEBUG)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))

        vi.clearAllMocks()
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))

        vi.clearAllMocks()
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.WARNING)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))

        vi.clearAllMocks()
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.ERROR)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))
    })

    it('prints dry run prefix when dry run configured', () => {
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.setDryRun(true)
        logging.info('m1', { report })
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Dry Run]'))

        vi.clearAllMocks()
        logging.setDryRun(false)
        logging.info('m1', { report })
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('[Dry Run]'))
    })

    it('defaults to log level info', () => {
        delete process.env.MONOWEAVE_LOG_LEVEL
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))
    })

    it('falls back to log level info', () => {
        process.env.MONOWEAVE_LOG_LEVEL = 'not-a-number'
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('m3'))
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('m4'))
    })

    it('prints extras', () => {
        process.env.MONOWEAVE_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.info('m1', { report, extras: 'extra info' })
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('m1'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('extra info'))
    })
})
