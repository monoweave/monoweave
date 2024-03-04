import { MDXProvider } from '@mdx-js/react'
import { graphql, useStaticQuery } from 'gatsby'
import * as React from 'react'

import CodeBlock from './CodeBlock'
import Header from './Header'
import Seo from './Seo'
import 'sanitize.css'
import './layout.css'

interface PageContext {
    frontmatter: {
        path: string
        title: string
    }
}

type Components = React.ComponentProps<typeof MDXProvider>['components']

const Strikethrough = React.forwardRef<HTMLSpanElement, { children: React.ReactNode }>(
    ({ children }, ref) => {
        return (
            <span className="strikethrough" ref={ref}>
                {children}
            </span>
        )
    },
)

const components: Components = {
    code: CodeBlock,
    delete: Strikethrough,
}

export const Layout: React.FC<{
    children: React.ReactNode | React.ReactNode[]
    pageContext?: PageContext
}> = ({ children, pageContext }) => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `)

    return (
        <MDXProvider components={components}>
            <Seo title={pageContext?.frontmatter?.title} />
            <Header siteTitle={data.site.siteMetadata?.title} />
            <div
                style={{
                    margin: '0 auto',
                    maxWidth: 960,
                    padding: '0 1.0875rem 1.45rem',
                }}
            >
                <main>{children}</main>
                <hr />
                <footer
                    style={{
                        marginTop: '2rem',
                    }}
                >
                    <a href="https://noahnu.com/" rel="noreferrer" target="_blank">
                        noahnu
                    </a>{' '}
                    © {new Date().getFullYear()}
                </footer>
            </div>
        </MDXProvider>
    )
}

export default Layout
