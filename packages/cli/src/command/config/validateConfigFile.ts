import type { MonoweaveConfigFile } from '@monoweave/types'
import schema from '@monoweave/types/schema.json'
import Ajv, { type ValidateFunction } from 'ajv/dist/2020'

const ajv = new Ajv({ allowUnionTypes: true, strictTuples: false, validateSchema: false })

export default (): ValidateFunction<MonoweaveConfigFile> => ajv.compile(schema)
