import childProcess from 'child_process'

async function main() {
    process.env.CI = '1'

    childProcess.execSync('yarn workspace @monoweave/e2e-tests test:registry:build', {
        stdio: 'inherit',
        encoding: 'utf-8',
    })
}

export default main
