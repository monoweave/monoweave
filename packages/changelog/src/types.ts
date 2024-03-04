export type TemplateContext = {
    version: string
    title: string
    host: string
    owner: any
    repository: string
    repoUrl: string
    currentTag: string
    previousTag: string | undefined
    linkCompare: boolean
}
