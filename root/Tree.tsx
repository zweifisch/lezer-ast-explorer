import { Tree, SyntaxNode } from '@lezer/common'
import { useEffect, useRef } from 'react'

export interface Line {
  kind: string
  content: string
  indent: number
  collapsed: boolean
  start: number
  end: number
  isLeaf: boolean
}

function toLines(tree: Tree, text: string, collapsed: Set<string>): Array<Line> {
  if (!tree.length) {
    return []
  }

  const cursor = tree.cursor()
  const lines: Array<Line> = []
  let indent = 0

  for (;;) {

    const isLeaf = !(cursor.firstChild() && cursor.parent())

    if (!cursor.type.isSkipped) {
      lines.push({
        kind: cursor.type.name,
        content: isLeaf ? text.slice(cursor.from, cursor.to) : '',
        indent,
        start: cursor.from,
        end: cursor.to,
        collapsed: collapsed.has(`${cursor.from}:${cursor.to}`),
        isLeaf,
      })
    }

    if (cursor.firstChild()) {
      indent ++
      continue
    }

    if (cursor.nextSibling()) {
      continue
    }

    for (;;) {
      if (cursor.type.isTop) return lines
      if (cursor.parent()) {
        indent --
      }
      if (cursor.nextSibling()) {
        break
      }
    }
  }
}

export function TreeView(props: {
  tree: Tree
  code: string
  node: SyntaxNode
  onLocate: (line: Line) => void
  style?: React.CSSProperties
}) {
  if (!props.tree) {
    return null
  }
  const lines = toLines(props.tree, props.code, new Set())

  const intersected = (line: Line) => {
    if (!props.node) return false
    if (!props.node.parent) return false
    return line.start >= props.node.from && line.end <= props.node.to
    || line.start <= props.node.from && line.end >= props.node.to
  }

  const matched = (line: Line) => line.start === props.node?.from && line.end === props.node?.to

  const ref = useRef<HTMLSpanElement>()

  useEffect(() => {
    if (ref.current) {
      console.log(ref.current)
      ref.current.scrollIntoView({
        block: 'center'
      })
    }
  }, [ref.current])

  return <div style={{...props.style, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
    {
      lines.map((line, index) => (
        <span
          key={index}
          onClick={() => props.onLocate(line)}
          style={{
            marginLeft: `${line.indent * 2}em`,
            padding: '3px 6px',
            borderRadius: '2px',
            cursor: 'pointer',
            background: intersected(line) ? 'rgba(255,240,6,0.4)' : 'none'
          }}
          {... matched(line) ? {ref} : {}}
        >
          {line.kind} {line.kind !== line.content ? line.content : ''}
        </span>
      ))
    }
  </div>
}
