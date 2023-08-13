import * as React from 'react'
import {Editor} from './Editor'

import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { rust } from '@codemirror/lang-rust'
import { java } from '@codemirror/lang-java'
import { less } from '@codemirror/lang-less'
import { markdown } from '@codemirror/lang-markdown'

import * as placeholders from './placeholders'

const languages = {
  javascript: [javascript, {jsx: true, typescript: true}],
  css: [css, {}],
  less: [less, {}],
  markdown: [markdown, {}],
  rust: [rust, {}],
  java: [java, {}],
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
      <div style={{display: 'flex', gap: '10px', padding: '10px'}}>
        {
          Object.keys(languages).map(l =>
            <div
              style={{background: lang === l ? '#fafafa' : '#efefef' , padding: '4px', cursor: 'pointer'}}
              key={l}
              onClick={() => setLang(l)}
            >
              {l}
            </div>
          )
        }
      </div>
      <Editor key={lang} style={{flexGrow: 1}} lang={langExt} value={code} onChange={handleEditorChange} />
    </div>
  </>
}
