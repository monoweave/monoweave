module.exports = {
    '{package.json,yarn.lock}': () => ['yarn dedupe', 'yarn constraints --fix'],
    '*.{yml,yaml}': (filenames) => {
        const files = filenames.join(' ')
        return `yarn yaml-validator ${files}`
    },
    '*.ts': (filenames) => {
        const files = filenames.join(' ')
        return [
            `yarn eslint --ext .ts ${files}`,
            `yarn bin:jest --bail --findRelatedTests --selectProjects "Unit/Integration" -- ${files}`,
        ]
    },
}
