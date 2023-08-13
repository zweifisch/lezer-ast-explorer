import * as React from 'react'
import { EditorView, basicSetup } from "codemirror"
import { ViewUpdate } from "@codemirror/view"
import { Line, TreeView} from './Tree'
import { syntaxTree } from "@codemirror/language"
import { EditorSelection } from '@codemirror/state'

interface EditorProps {
  value: string
  onChange: (content: string) => void
  lang: any
  style?: React.CSSProperties
}

export function Editor(props: EditorProps) {

  const ref = React.useRef()

  const [tree, setTree] = React.useState(undefined)
  const [code, setCode] = React.useState(props.value)
  const [head, setHead] = React.useState(undefined)
  const [node, setNode] = React.useState(undefined)

  React.useEffect(() => {
    if (editor.current && !editor.current.hasFocus) {
      editor.current.dispatch(
        editor.current.state.update({
          changes: {
            from: 0,
            to: editor.current.state.doc.length,
            insert: props.value || '',
          },
        }),
      )
    }
  }, [props.value])

  const editor = React.useRef<EditorView>()

  React.useEffect(() => {
    if (!ref.current) {
      return
    }

    editor.current = new EditorView({
      doc: props.value,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const code = editor.current.state.doc.toString()
            setCode(code)
            props.onChange(code)
            setTree(syntaxTree(update.state))
          }

          if (update.selectionSet) {
            setHead(update.state.selection.main.head)
          }
        }),
        props.lang,
      ],
      parent: ref.current,
    })

  }, [ref])

  React.useEffect(() => {
    if (head && tree) {
      const node = tree.resolve(head, -1)
      setNode(node)
    }
  }, [head, tree])

  const onLocate = (line: Line) => {
    editor.current?.dispatch({
      selection: {anchor: line.start, head: line.end},
      effects: EditorView.scrollIntoView(EditorSelection.range(line.start, line.end), {y: 'center'})
    })
  }

  return (
    <div
      style={{
        height: '50%',
        display: 'flex',
        ... props.style,
      }}
    >
      <div
        style={{
          width: '50%',
          height: '100%',
          overflow: 'auto',
        }}
        ref={ref}
      ></div>
      <TreeView
        style={{
          width: '50%',
          height: '100%',
          fontSize: '12px',
          fontFamily: 'monospace',
          overflow: 'auto'
        }}
        tree={tree}
        node={node}
        code={code}
        onLocate={onLocate}
      />
    </div>
  )
}
