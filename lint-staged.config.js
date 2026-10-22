import { readFile } from 'node:fs/promises'

import YAML from 'yaml'

const validateYaml = async (filenames) => {
  const errors = []

  for (const filename of filenames) {
    const contents = await readFile(filename, 'utf8')
    if (contents.trim() === '') {
      errors.push(`${filename}: File is empty`)
      continue
    }

    try {
      // Same options as config loading, so a file the app accepts is not rejected here.
      YAML.parse(contents, { strict: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${filename}: ${message}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n\n'))
  }
}

export default {
  '{package.json,yarn.lock}': () => ['yarn dedupe', 'yarn constraints --fix'],
  '*.{yml,yaml}': {
    title: 'yaml valid',
    task: validateYaml,
  },
  '*.{ts,cts,mts}': (filenames) => {
    const files = filenames.join(' ')
    return [
      `yarn lint`,
      `yarn bin:vitest --bail=1 --changed --project="Unit/Integration" -- ${files}`,
    ]
  },
}
