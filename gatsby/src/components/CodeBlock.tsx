import { Highlight, type Language, themes } from 'prism-react-renderer'
import React from 'react'

const CodeBlock: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, className }) => {
    const language = (className?.replace(/language-/, '') as Language | undefined) ?? undefined

    return language ? (
        <Highlight theme={themes.vsDark} code={String(children).trim()} language={language}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={{ ...style, padding: '20px' }}>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token, key })} />
                            ))}
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    ) : (
        <pre className="inline-code">{String(children)}</pre>
    )
}

export default CodeBlock
