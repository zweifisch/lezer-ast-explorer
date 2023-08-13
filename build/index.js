"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const http_1 = __importDefault(require("http"));
const fs_1 = require("fs");
const url_1 = require("url");
const esbuild_1 = __importDefault(require("esbuild"));
const path_1 = __importDefault(require("path"));
const esbuild_plugin_global_externals_1 = require("@fal-works/esbuild-plugin-global-externals");
function findFile(files) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const file of files) {
            try {
                yield fs_1.promises.access(file);
                return file;
            }
            catch (_a) { }
        }
    });
}
const globalName = 'lezerAstViewer';
const root = 'root';
const dist = 'dist';
function bundle(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const outfile = opts.outfile || path_1.default.join('build', opts.entry.slice(0, -4) + '.js');
        yield esbuild_1.default.build({
            entryPoints: [opts.entry],
            outfile,
            bundle: true,
            external: ['react', 'react-dom'],
            sourcemap: 'inline',
            globalName,
            plugins: [
                (0, esbuild_plugin_global_externals_1.globalExternals)({
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
        });
        return outfile;
    });
}
const html = (entry) => `\
<!doctype html><meta charset=utf-8><head>\
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>\
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>\
<script src="${entry}.js"></script>\
<style>* {margin: 0; padding: 0;} body {background: #eee;}</style>\
<title></title></head><div id=main></div>\
<script>ReactDOM.render(React.createElement(${globalName}.default),document.getElementById('main'))</script>\
`;
function serve() {
    const server = http_1.default.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
        const url = new url_1.URL(req.url, `http://${req.headers.host}`);
        if (url.pathname.startsWith('/node_modules/')) {
            (0, fs_1.createReadStream)(url.pathname.slice(1)).pipe(res);
            return;
        }
        const requestingJS = path_1.default.extname(url.pathname) === '.js';
        const path = requestingJS ? url.pathname.slice(1, -3) : url.pathname.slice(1);
        const file = yield findFile([`${path}.tsx`, path_1.default.join(root, path, 'index.tsx')]);
        if (!file) {
            console.log(404, req.url);
            res.writeHead(404);
            res.end();
            return;
        }
        if (requestingJS) {
            res.setHeader('content-type', 'application/javascript');
            (0, fs_1.createReadStream)(yield bundle({ entry: file })).pipe(res);
            return;
        }
        res.setHeader('content-type', 'text/html');
        res.write(html(file.slice(0, -4)));
        res.end();
    }));
    const port = process.env.PORT || 17177;
    server.listen(port, () => {
        console.log(`listen on ${port}`);
    });
}
function ensureDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (path_1.default.dirname(dir) === dir)
            return;
        yield fs_1.promises.stat(dir).catch(() => __awaiter(this, void 0, void 0, function* () {
            yield ensureDir(path_1.default.dirname(dir));
            yield fs_1.promises.mkdir(dir);
        }));
    });
}
function writeTextFile(path, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureDir(path_1.default.dirname(path));
        return fs_1.promises.writeFile(path, content, 'utf8');
    });
}
function build() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_1.promises.readdir(root);
        for (const file of files) {
            if (file.endsWith('index.tsx')) {
                yield bundle({
                    entry: path_1.default.join(root, file),
                    outfile: path_1.default.join(dist, file.replace('.tsx', '.js')),
                });
            }
        }
        yield writeTextFile(path_1.default.join(dist, 'index.html'), html('index'));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const [_bin, _script, ...params] = process.argv;
        if (params[0] === 'build') {
            yield build();
        }
        else {
            serve();
        }
    });
}
exports.main = main;
