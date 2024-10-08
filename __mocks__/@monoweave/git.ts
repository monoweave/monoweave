/* eslint-disable @typescript-eslint/no-unused-vars */

import { jest } from '@jest/globals'
import type { CommitMessage, MonoweaveConfiguration, YarnContext } from '@monoweave/types'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const actualMonoweaveGit = jest.requireActual<typeof import('@monoweave/git')>('@monoweave/git')

const registry: {
    commits: CommitMessage[]
    filesModified: Map<string, string[]>
    tags: string[]
    pushedTags: string[]
    lastTaggedCommit?: string
    pushedCommits: string[]
    stagedFiles: string[]
} = {
    commits: [],
    filesModified: new Map(),
    tags: [],
    pushedTags: [],
    pushedCommits: [],
    lastTaggedCommit: undefined,
    stagedFiles: [],
}

const _reset_ = (): void => {
    registry.commits = []
    registry.filesModified = new Map()
    registry.tags = []
    registry.pushedTags = []
    registry.pushedCommits = []
    registry.lastTaggedCommit = undefined
    registry.stagedFiles = []
}

const _commitFiles_ = (sha: string, commit: string, files: string[]): void => {
    registry.commits.push({ sha, body: commit })
    registry.filesModified.set(sha, registry.filesModified.get(sha) ?? [])
    registry.filesModified.get(sha)!.push(...files)
}

const _getPushedTags_ = (): string[] => {
    return registry.pushedTags
}

const _getTags_ = (): string[] => {
    return registry.tags
}

const _getRegistry_ = (): typeof registry => registry

const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context: YarnContext },
): Promise<string> => {
    return `sha:${ref}`
}

const gitUpstreamBranch = async ({
    cwd,
    context,
    remote,
}: {
    cwd: string
    context?: YarnContext
    remote: string
}): Promise<string> => {
    return `${remote}/main`
}

const gitDiffTree = async (
    ref: string,
    {
        cwd,
        context,
        onlyIncludeDeletedFiles,
        paths,
        fetch = false,
    }: {
        cwd: string
        context?: YarnContext
        onlyIncludeDeletedFiles?: boolean
        paths?: string[]
        fetch?: boolean
    },
): Promise<string> => {
    return (registry.filesModified.get(ref) ?? []).join('\n')
}

const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER, context }: { cwd: string; DELIMITER: string; context: YarnContext },
): Promise<string> => {
    return registry.commits.map((commit) => `${commit.sha}\n${commit.body}`).join(`${DELIMITER}\n`)
}

const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context: YarnContext },
): Promise<void> => {
    registry.tags.push(tag)
    registry.lastTaggedCommit = registry.commits[registry.commits.length - 1]?.sha
}

const gitPushTags = async ({
    cwd,
    remote,
    context,
    dryRun = false,
}: {
    cwd: string
    remote: string
    context: YarnContext
    dryRun?: boolean
}): Promise<void> => {
    if (dryRun) return
    registry.pushedTags = Array.from(new Set([...registry.pushedTags, ...registry.tags]))
}

const gitPull = async ({
    cwd,
    remote,
    context,
}: {
    cwd: string
    remote: string
    context?: YarnContext
}): Promise<void> => {
    /* do nothing */
}

const gitPush = async ({
    cwd,
    remote,
    context,
    dryRun = false,
}: {
    cwd: string
    remote: string
    context: YarnContext
    dryRun?: boolean
}): Promise<void> => {
    if (dryRun) return
    for (const commit of registry.commits) {
        registry.pushedCommits.push(commit.sha)
    }
}

export const gitAdd = async (
    paths: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    registry.stagedFiles.push(...paths)
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    const newSha = Math.random().toString(36).substr(2, 5)
    _commitFiles_(newSha, message, registry.stagedFiles)
    registry.stagedFiles = []
}

const gitLastTaggedCommit = async ({
    cwd,
    context,
    prerelease = false,
}: {
    cwd: string
    context: YarnContext
    prerelease?: boolean
}): Promise<{ sha: string; tag: string | null }> => {
    if (!registry.lastTaggedCommit) {
        throw new Error('No tagged commit.')
    }
    return { sha: registry.lastTaggedCommit, tag: registry.tags[registry.tags.length - 1] ?? null }
}

export const getCommitMessages = async (
    config: MonoweaveConfiguration,
    context: YarnContext,
): Promise<CommitMessage[]> => {
    const DELIMITER = '-----------------monoweave-----------------'

    const to = config.git.commitSha
    let from = config.git.baseBranch
    if (!from) {
        const { sha, tag } = await gitLastTaggedCommit({
            cwd: config.cwd,
            context,
            prerelease: config.prerelease,
        })
        from = sha

        if (to === from && tag !== null) {
            // the latest commit is the tagged commit, this run of monoweave should be a no-op
            return []
        }
    }

    const logOutput = await gitLog(from, to, {
        cwd: config.cwd,
        DELIMITER,
        context,
    })
    return logOutput
        .toString()
        .split(`${DELIMITER}\n`)
        .map((logEntry) => {
            const [sha, ...msg] = logEntry.split('\n')
            return { sha, body: msg.join('\n') }
        })
        .filter((msg) => msg.body)
}

export const gitGlob = async (
    globs: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string[]> => {
    return globs // TODO: not entirely accurate
}

export const gitCheckout = async (
    { files }: { files: string[] },
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    //
}

module.exports = {
    __esModule: true,
    _commitFiles_,
    _getPushedTags_,
    _getTags_,
    _reset_,
    _getRegistry_,
    ...actualMonoweaveGit,
    getCommitMessages,
    gitAdd,
    gitCommit,
    gitDiffTree,
    gitLastTaggedCommit,
    gitLog,
    gitPull,
    gitGlob,
    gitPush,
    gitPushTags,
    gitResolveSha,
    gitTag,
    gitUpstreamBranch,
}
