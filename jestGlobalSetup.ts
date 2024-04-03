async function setup() {
    if (process.env.DEBUG) {
        process.on('warning', (error) => {
            console.error(error.message, error.stack)
        })
    }

    // gitUpstreamBranch behaves differently if it detects we're in a GitHub workflow
    delete process.env.GITHUB_ACTION
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_EVENT_NAME
}

export default setup
