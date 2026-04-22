/**
 * Morphism.io Rust Compile Server
 * 零依赖 Node.js HTTP 服务器，调用本地 rustc 编译代码
 * 运行：node server.js
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = 3741;

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rustc: true }));
    return;
  }

  // 编译端点
  if (req.method === 'POST' && req.url === '/compile') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let code;
      try {
        code = JSON.parse(body).code;
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      // 写入临时文件
      const id = crypto.randomBytes(4).toString('hex');
      const tmpDir = os.tmpdir();
      const srcFile = path.join(tmpDir, `morphism_${id}.rs`);
      const outFile = path.join(tmpDir, `morphism_${id}`);

      fs.writeFileSync(srcFile, code, 'utf-8');

      // 尝试定位 rustc
      const cargoBin = path.join(os.homedir(), '.cargo', 'bin', 'rustc.exe');
      let rustcCmd = 'rustc';
      
      if (!fs.existsSync(srcFile)) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to write source file' }));
        return;
      }

      const execOptions = { timeout: 30000, env: { ...process.env } };
      
      // 如果默认 PATH 找不到，手动添加 cargo bin
      if (process.platform === 'win32') {
        const binPath = path.join(os.homedir(), '.cargo', 'bin');
        if (process.env.PATH) {
          execOptions.env.PATH = `${binPath};${process.env.PATH}`;
        } else {
          execOptions.env.PATH = binPath;
        }
      }

      const cmd = `rustc --edition 2021 --crate-type lib --emit=metadata -o "${outFile}" "${srcFile}" 2>&1`;

      const startTime = Date.now();
      exec(cmd, execOptions, (err, stdout, stderr) => {
        const elapsed = Date.now() - startTime;
        const output = (stdout || '') + (stderr || '');

        // 清理临时文件
        try { fs.unlinkSync(srcFile); } catch {}
        try { fs.unlinkSync(outFile); } catch {}
        try { fs.unlinkSync(outFile + '.rmeta'); } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: !err,
          output: output.trim(),
          elapsed_ms: elapsed,
          exit_code: err ? (err.code || 1) : 0
        }));
      });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  ▶  Morphism.io Rust Compile Server`);
  console.log(`     Listening on http://127.0.0.1:${PORT}`);
  console.log(`     Endpoint: POST /compile { "code": "..." }\n`);

  // 检查 rustc 是否可用
  const binPath = path.join(os.homedir(), '.cargo', 'bin');
  const env = { ...process.env };
  if (process.platform === 'win32') {
    env.PATH = `${binPath};${process.env.PATH || ''}`;
  }

  exec('rustc --version', { env }, (err, stdout) => {
    if (err) {
      console.warn('  ⚠  rustc not found in PATH. Please install Rust: https://rustup.rs');
    } else {
      console.log(`  ✓  ${stdout.trim()}`);
    }
    console.log('');
  });
});
