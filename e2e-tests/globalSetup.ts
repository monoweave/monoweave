import childProcess from 'child_process'

async function main() {
    process.env.CI = '1'

    // gitUpstreamBranch behaves differently if it detects we're in a GitHub workflow
    delete process.env.GITHUB_ACTION
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_EVENT_NAME

    childProcess.execSync('yarn workspace @monoweave/e2e-tests test:registry:build', {
        stdio: 'inherit',
        encoding: 'utf-8',
    })
}

export default main
