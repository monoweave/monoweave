/**
 * Are we are operating in a CI environment?
 *
 * We look for a CI environment variable that is neither an empty string, 0, or false.
 */
export function detectIsInCI() {
    return Boolean(
        'CI' in process.env &&
        !['', '0', 'false', 'undefined', 'null'].includes((process.env.CI || '').toLowerCase()),
    )
}
