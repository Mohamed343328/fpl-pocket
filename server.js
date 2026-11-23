// Lightweight Node.js server for FPL Pocket (no third-party packages required)
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const fplBase = 'https://fantasy.premierleague.com/api';
async function proxy(pathname,res){try{const response=await fetch(fplBase+pathname,{headers:{'User-Agent':'FPL-Pocket/1.0'}});const data=await response.text();res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(data);}catch(err){res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'FPL API unreachable',detail:err.message}));}}
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  const route=url.pathname.slice(5);
  if(route==='bootstrap-static'||/^entry\/\d+$/.test(route)||/^event\/\d+\/live$/.test(route))return proxy('/'+route,res);
  res.writeHead(404,{'Content-Type':'application/json'});return res.end('{"error":"Unknown API endpoint"}');
 }
 let filePath=path.join(ROOT,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));
 if(!filePath.startsWith(ROOT)){res.writeHead(403);return res.end('Forbidden');}
 fs.readFile(filePath,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(filePath)]||'application/octet-stream','Cache-Control':filePath.endsWith('sw.js')?'no-cache':'public, max-age=300'});res.end(data);});
}).listen(PORT,()=>console.log(`FPL Pocket listening on http://localhost:${PORT}`));
