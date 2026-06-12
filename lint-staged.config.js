export default {
  '{package.json,yarn.lock}': () => ['yarn dedupe', 'yarn constraints --fix'],
  '*.{yml,yaml}': (filenames) => {
    const files = filenames.join(' ')
    return `yarn yaml-validator ${files}`
  },
  '*.{ts,cts,mts}': (filenames) => {
    const files = filenames.join(' ')
    return [
      `yarn lint`,
      `yarn bin:vitest --bail=1 --changed --project="Unit/Integration" -- ${files}`,
    ]
  },
}
