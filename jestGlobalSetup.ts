async function setup() {
    if (process.env.DEBUG) {
        process.on('warning', (error) => {
            console.error(error.message, error.stack)
        })
    }
}

export default setup
