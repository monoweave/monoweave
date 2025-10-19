import type { MonoweaveConfigFile } from '@monoweave/types'
import schema from '@monoweave/types/schema.json' with { type: 'json' }
import Ajv, { type ValidateFunction } from 'ajv/dist/2020.js'

const ajv = new Ajv.default({ allowUnionTypes: true, strictTuples: false, validateSchema: false })

export default (): ValidateFunction<MonoweaveConfigFile> => ajv.compile(schema)
