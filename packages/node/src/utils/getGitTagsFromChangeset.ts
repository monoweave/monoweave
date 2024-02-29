import { type ChangesetSchema } from '@monoweave/types'

export function getGitTagsFromChangeset(changeset: ChangesetSchema) {
    return new Map(
        Object.entries(changeset)
            .map(([name, change]) => [name, change.tag])
            .filter((change): change is [string, string] => Boolean(change[1])),
    )
}
