import { exec } from '@monoweave/io'
import logging, { assertProduction } from '@monoweave/logging'
import { type YarnContext } from '@monoweave/types'
import micromatch from 'micromatch'

const git = async (
    subcommand: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
) => {
    const command = `git ${subcommand}`
    logging.debug(`[Exec] ${command}`, { report: context?.report })

    return await exec(command, { cwd, env: { GIT_TERMINAL_PROMPT: '0', ...process.env } })
}

export const gitUpstreamBranch = async ({
    cwd,
    context,
    remote,
}: {
    cwd: string
    context?: YarnContext
    remote: string
}): Promise<string> => {
    if (process.env.GITHUB_ACTION) {
        if (process.env.GITHUB_REF && process.env.GITHUB_EVENT_NAME === 'push') {
            // In GitHub actions for push events, we can use GITHUB_REF.
            return process.env.GITHUB_REF
        }
        if (process.env.GITHUB_BASE_REF && process.env.GITHUB_EVENT_NAME === 'pull_request') {
            return `${remote}/${process.env.GITHUB_BASE_REF}`
        }
    }

    const { stdout: branch } = await git('rev-parse --abbrev-ref --symbolic-full-name @\\{u\\}', {
        cwd,
        context,
    })
    return branch
}

export const gitCheckout = async (
    { files }: { files: string[] },
    { cwd, context, remote }: { cwd: string; context?: YarnContext; remote: string },
): Promise<void> => {
    const branch = await gitUpstreamBranch({ cwd, context, remote })
    await git(`checkout ${branch.trim()} -- ${files.map((f) => `"${f}"`).join(' ')}`, {
        cwd,
        context,
    })
}

export const gitResolveSha = async (
    ref: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string> => {
    const { stdout } = await git(`log --format=%H -n 1 ${ref}`, {
        cwd,
        context,
    })
    return stdout.trim()
}

export const gitDiffTree = async (
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
    if (fetch) {
        await git('fetch', { cwd, context })
    }

    const args: string[] = ['--no-commit-id', '--name-only', '-r', '--root', '--relative']
    if (onlyIncludeDeletedFiles) {
        args.push('--diff-filter=D')
    }

    let command = `diff-tree ${args.join(' ')} ${ref.trim()}`
    if (paths?.length) {
        command += ` -- ${paths.map((p) => `"${p}"`)}`
    }

    const { stdout } = await git(command, {
        cwd,
        context,
    })
    return stdout.trim()
}

export const gitLog = async (
    from: string,
    to: string,
    { cwd, DELIMITER, context }: { cwd: string; DELIMITER: string; context?: YarnContext },
): Promise<string> => {
    let command = `log ${from}..${to} --format=%H%n%B%n${DELIMITER}`
    if (from === to) {
        /* Special case where we'll just return a single log entry for "to". */
        command = `log -1 ${to} --format=%H%n%B%n${DELIMITER}`
    }
    const { stdout } = await git(command, { cwd, context })
    return stdout
}

export const gitTag = async (
    tag: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await git(`tag ${tag} -m ${tag}`, { cwd, context })
}

export const gitPushTags = async ({
    cwd,
    remote,
    context,
    dryRun = false,
}: {
    cwd: string
    remote: string
    context?: YarnContext
    dryRun?: boolean
}): Promise<void> => {
    assertProduction()

    const args = ['--tags']
    if (dryRun) args.push('--dry-run')

    await git(`push ${args.join(' ')} ${remote}`, {
        cwd,
        context,
    })
}

export const gitPull = async ({
    cwd,
    remote,
    context,
    autostash = false,
    strategyOption,
}: {
    cwd: string
    remote: string
    context?: YarnContext
    autostash?: boolean
    strategyOption?: 'theirs'
}): Promise<void> => {
    assertProduction()
    const args = ['--rebase', '--no-verify']
    if (autostash) args.push('--autostash')
    if (strategyOption) args.push(`--strategy-option=${strategyOption}`)
    await git(`pull ${args.join(' ')} ${remote}`, {
        cwd,
        context,
    })
}

export const gitPush = async ({
    cwd,
    remote,
    context,
    dryRun = false,
}: {
    cwd: string
    remote: string
    context?: YarnContext
    dryRun?: boolean
}): Promise<void> => {
    assertProduction()

    const args = ['--no-verify']
    if (dryRun) args.push('--dry-run')

    await git(`push ${args.join(' ')} ${remote}`, {
        cwd,
        context,
    })
}

export const gitLastTaggedCommit = async ({
    cwd,
    context,
    prerelease = false,
}: {
    cwd: string
    context?: YarnContext
    prerelease?: boolean
}): Promise<{ sha: string; tag: string | null }> => {
    let command = "describe --abbrev=0 --match '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*'"

    if (!prerelease) {
        // The glob matches prerelease ranges. The 'complexity' comes from not wanting
        // to be overeager in producing a false positive for a tag such as
        // `@scope-with-hyphen/name.with.dot-and-hyphen`
        command = `${command} --exclude '*@*[[:digit:]]*.[[:digit:]]*.[[:digit:]]*-*'`
    }

    let tag: string | null = null

    try {
        tag = (await git(command, { cwd, context })).stdout.trim()
    } catch {
        logging.warning('[Exec] Fetching most recent tag failed, falling back to HEAD', {
            report: context?.report,
        })
    }

    const sha = (
        await git(`rev-list -1 ${tag ?? 'HEAD'}`, {
            cwd,
            context,
        })
    ).stdout
        .toString()
        .trim()

    return { sha, tag }
}

export const gitGlob = async (
    globs: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<string[]> => {
    const rawStdout = [
        (await git('ls-files --modified', { cwd, context })).stdout,
        (await git('ls-files -o --exclude-standard', { cwd, context })).stdout,
    ].join('\n')
    const files = rawStdout.split('\n').filter((v) => Boolean(v))
    return micromatch(files, globs)
}

export const gitAdd = async (
    paths: string[],
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await git(`add ${paths.join(' ')}`, { cwd, context })
}

export const gitCommit = async (
    message: string,
    { cwd, context }: { cwd: string; context?: YarnContext },
): Promise<void> => {
    assertProduction()
    await git(`commit -m "${message}" -n`, { cwd, context })
}
