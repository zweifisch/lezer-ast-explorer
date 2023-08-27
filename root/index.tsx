import * as React from 'react'
import {Editor} from './Editor'

import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { rust } from '@codemirror/lang-rust'
import { java } from '@codemirror/lang-java'
import { less } from '@codemirror/lang-less'
import { markdown } from '@codemirror/lang-markdown'
import { xml } from '@codemirror/lang-xml'

import * as placeholders from './placeholders'

const languages = {
  javascript: [javascript, {jsx: true, typescript: true}],
  css: [css, {}],
  less: [less, {}],
  markdown: [markdown, {}],
  rust: [rust, {}],
  java: [java, {}],
  xml: [xml, {}],
}

export default function() {

  const initialLang = React.useMemo(() => {
    return localStorage.getItem('lang') || 'javascript'
  }, [])

  const [lang, setLang] = React.useState(initialLang)
  const [code, setCode] = React.useState('')

  const langExt = React.useMemo(() => {
    const [factory, options] = languages[lang]
    localStorage.setItem('lang', lang)
    return factory(options)
  }, [lang])

  const handleEditorChange = (code: string) => {
    setCode(code)
    localStorage.setItem(lang, code)
  }

  React.useEffect(() => {
    setCode(localStorage.getItem(lang) || placeholders[lang] || '')
  }, [lang])

  React.useEffect(() => {
    document.title = 'Lezer AST Explorer'
  }, [])

  const style = `
div::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

div::-webkit-scrollbar-track-piece {
  background: #efefef;
}

div::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

html {
  font-family: monospace;
}

.cm-focused {
  outline: none !important;
}
  `

  return <>

    <style>{style}</style>

    <div style={{height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', gap: '10px', padding: '0', borderBottom: '1px solid #ccc'}}>
        {
          Object.keys(languages).map(l =>
            <div
              style={{background: lang === l ? '#fafafa' : '#efefef' , padding: '10px 6px', cursor: 'pointer'}}
              key={l}
              onClick={() => setLang(l)}
            >
              {l}
            </div>
          )
        }
      </div>
      <Editor key={lang} style={{flexGrow: 1}} lang={langExt} value={code} onChange={handleEditorChange} />
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid #ccc', padding: '6px', gap: '0.5em'}}>
        Built with 
        <a href="https://react.dev/">React</a>
        <a href="https://codemirror.net/">CodeMirror</a>
        and
        <a href="https://esbuild.github.io/">esbuild</a>
        |
        <a href="https://github.com/zweifisch/lezer-ast-explorer">GitHub</a>
      </div>
    </div>
  </>
}
