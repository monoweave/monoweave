export const describeIf = (condition: () => boolean) => (condition() ? describe : describe.skip)
export const itIf = (condition: () => boolean) => (condition() ? it : it.skip)
