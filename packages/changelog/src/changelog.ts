import { Readable } from 'stream'

import { parseRepositoryProperty } from '@monoweave/git'
import { readStream, readStreamString } from '@monoweave/io'
import type { CommitMessage, MonoweaveConfiguration, YarnContext } from '@monoweave/types'
import { structUtils } from '@yarnpkg/core'
import conventionalChangelogWriter from 'conventional-changelog-writer'
import conventionalCommitsParser, { type Commit } from 'conventional-commits-parser'

import { defaultChangelogWriter } from './defaultChangelogWriter.js'
import resolveConventionalConfig from './resolveConventionalConfig.js'
import { type TemplateContext } from './types.js'

export const generateChangelogEntry = async ({
    config,
    context,
    packageName,
    previousVersion,
    newVersion,
    commits,
}: {
    config: MonoweaveConfiguration
    context: YarnContext
    packageName: string
    previousVersion: string | null
    newVersion: string
    commits: CommitMessage[]
}): Promise<string | null> => {
    if (!commits.length) {
        return null
    }

    const ident = structUtils.parseIdent(packageName)
    const workspace = context.project.getWorkspaceByIdent(ident)
    const { host, owner, repository, repoUrl } = await parseRepositoryProperty(workspace)
    const templateContext: TemplateContext = {
        version: newVersion,
        title: packageName,
        host: host ?? '',
        owner: owner ?? workspace.manifest.raw?.author ?? '',
        repository: repository ?? '',
        repoUrl: repoUrl ?? '',
        currentTag: `${packageName}@${newVersion}`,
        previousTag: previousVersion ? `${packageName}@${previousVersion}` : undefined,
        linkCompare: Boolean(previousVersion),
    }

    if (!config.conventionalChangelogConfig) {
        return await defaultChangelogWriter({
            commits,
            templateContext,
        })
    }

    const conventionalConfig = await resolveConventionalConfig({ config })

    const commitsStream = Readable.from(
        commits.map((commit) => `${commit.body}\n-hash-\n${commit.sha}`),
    ).pipe(conventionalCommitsParser(conventionalConfig.parserOpts))
    const conventionalCommits = await readStream<Commit>(commitsStream)

    const changelogWriter = conventionalChangelogWriter(
        templateContext,
        conventionalConfig.writerOpts,
    )

    async function* transformedCommits() {
        for (const commit of conventionalCommits) {
            // NOTE: This mutates the commit.
            const mutableCommit = JSON.parse(JSON.stringify(commit))

            if (!mutableCommit.hash && config.git.commitSha) {
                mutableCommit.hash = config.git.commitSha
            }

            yield mutableCommit
        }
    }

    const pipeline = Readable.from(transformedCommits()).pipe(changelogWriter)

    return readStreamString(pipeline)
}
