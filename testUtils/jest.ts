import { describe, it } from '@jest/globals'

export const describeIf = (
    condition: () => boolean,
): typeof describe | (typeof describe)['skip'] => (condition() ? describe : describe.skip)
export const itIf = (condition: () => boolean): typeof it | (typeof it)['skip'] =>
    condition() ? it : it.skip
