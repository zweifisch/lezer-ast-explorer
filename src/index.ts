import http from 'http'
import {promises as fs, createReadStream} from 'fs'
import {URL} from 'url'
import esbuild from 'esbuild'
import pth from 'path'
import { globalExternals } from "@fal-works/esbuild-plugin-global-externals"

async function findFile(files: Array<string>) {
  for (const file of files) {
    try {
      await fs.access(file)
      return file
    } catch {}
  }
}

const globalName = 'lezerAstViewer'
const root = 'root'
const dist = 'dist'

async function bundle(opts: {
  entry: string
  outfile?: string
}) {
  const outfile = opts.outfile || pth.join('build', opts.entry.slice(0, -4) + '.js')
  await esbuild.build({
    entryPoints: [opts.entry],
    outfile,
    bundle: true,
    external: ['react', 'react-dom'],
    sourcemap: 'inline',
    globalName,
    plugins: [
      globalExternals({
        'react': {
          varName: 'React',
          type: 'cjs',
        },
        'react-dom': {
          varName: 'ReactDOM',
          namedExports: ['createPortal'],
          type: 'esm'
        },
      })
    ]
  })
  return outfile
}

const html = (entry: string) => `\
<!doctype html><meta charset=utf-8><head>\
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>\
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>\
<script src="${entry}.js"></script>\
<style>* {margin: 0; padding: 0;} body {background: #eee;}</style>\
<title></title></head><div id=main></div>\
<script>ReactDOM.render(React.createElement(${globalName}.default),document.getElementById('main'))</script>\
`

function serve() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.pathname.startsWith('/node_modules/')) {
      createReadStream(url.pathname.slice(1)).pipe(res)
      return
    }

    const requestingJS = pth.extname(url.pathname) === '.js'

    const path = requestingJS ? url.pathname.slice(1, -3) : url.pathname.slice(1)

    const file = await findFile([`${path}.tsx`, pth.join(root, path, 'index.tsx')])

    if (!file) {
      console.log(404, req.url)
      res.writeHead(404)
      res.end()
      return
    }

    if (requestingJS) {
      res.setHeader('content-type', 'application/javascript')
      createReadStream(await bundle({entry: file})).pipe(res)
      return
    }

    res.setHeader('content-type', 'text/html')
    res.write(html(file.slice(0, -4)))
    res.end()
  })

  const port = process.env.PORT || 17177
  server.listen(port, () => {
    console.log(`listen on ${port}`)
  })
}

async function ensureDir(dir: string) {
  if (pth.dirname(dir) === dir) return
  await fs.stat(dir).catch(async () => {
    await ensureDir(pth.dirname(dir))
    await fs.mkdir(dir)
  })
}

async function writeTextFile(path: string, content: string) {
  await ensureDir(pth.dirname(path))
  return fs.writeFile(path, content, 'utf8')
}

async function build() {
  const files = await fs.readdir(root)
  for (const file of files) {
    if (file.endsWith('index.tsx')) {
      await bundle({
        entry: pth.join(root, file),
        outfile: pth.join(dist, file.replace('.tsx', '.js')),
      })
    }
  }
  await writeTextFile(pth.join(dist, 'index.html'), html('index'))
}

export async function main() {
  const [_bin, _script, ...params] = process.argv
  if (params[0] === 'build') {
    await build()
  } else {
    serve()
  }
}
