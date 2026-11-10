// Savelink server: serves the site and runs yt-dlp. No npm packages needed.
const http=require("http"),fs=require("fs"),os=require("os"),path=require("path"),net=require("net");
const dns=require("dns").promises,{spawn,execFile}=require("child_process");
const PORT=process.env.PORT||3000,PUB=path.join(__dirname,"public");
const MIME={".html":"text/html; charset=utf-8",".txt":"text/plain",".xml":"application/xml",".png":"image/png",".svg":"image/svg+xml",".ico":"image/x-icon"};
const FMT={video:"bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",small:"b[height<=480][ext=mp4]/worst[ext=mp4]/worst",audio:"bestaudio[ext=m4a]/bestaudio"};
const hits=new Map();let busy=0;

const ipOf=req=>(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"").split(",")[0].trim();
const limited=ip=>{const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<6e5);a.push(n);hits.set(ip,a);return a.length>30}; // 30 requests / 10 min / visitor
setInterval(()=>hits.clear(),36e5).unref();
const priv=ip=>{ip=ip.replace(/^::ffff:/,"");return net.isIPv6(ip)?/^(::1?$|f[cd]|fe80)/i.test(ip):/^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)};
const send=(res,code,obj)=>{res.writeHead(code,{"Content-Type":"application/json"});res.end(JSON.stringify(obj))};

// Only public http(s) links are allowed, so nobody can aim the server at your private network.
async function safe(raw){
  let u;try{u=new URL(raw)}catch{return null}
  if(!/^https?:$/.test(u.protocol))return null;
  try{const r=await dns.lookup(u.hostname,{all:true});if(!r.length||r.some(x=>priv(x.address)))return null}catch{return null}
  return u.href;
}

async function info(req,res){
  let body="";for await(const c of req){body+=c;if(body.length>2048)return send(res,413,{error:"too large"})}
  let url;try{url=await safe(JSON.parse(body).url)}catch{}
  if(!url)return send(res,400,{error:"bad link"});
  execFile("yt-dlp",["-J","--no-playlist","--no-warnings","--",url],{timeout:6e4,maxBuffer:3e7},(err,out)=>{
    let j;try{if(err)throw 0;j=JSON.parse(out)}catch{return send(res,422,{error:"unavailable"})}
    const f=j.formats||[],vid=f.some(x=>x.vcodec&&x.vcodec!=="none"),aud=f.some(x=>x.acodec&&x.acodec!=="none");
    const q=t=>"/api/file?type="+t+"&url="+encodeURIComponent(url);
    const items=vid?[{label:"Video · best",url:q("video")},{label:"Video · smaller",url:q("small")}]:[{label:"Photo",url:q("video")}];
    if(vid&&aud)items.push({label:"Audio only",url:q("audio")});
    send(res,200,{title:j.title,thumbnail:j.thumbnail,items});
  });
}

async function file(req,res,q){
  const url=await safe(q.get("url")||""),fmt=FMT[q.get("type")]||FMT.video;
  if(!url)return send(res,400,{error:"bad link"});
  if(busy>=3)return send(res,503,{error:"busy"}); // max 3 downloads at once
  busy++;const dir=fs.mkdtempSync(path.join(os.tmpdir(),"sl-"));
  const done=()=>{busy--;fs.rm(dir,{recursive:true,force:true},()=>{})};
  const p=spawn("yt-dlp",["-f",fmt,"--no-playlist","--no-warnings","--max-filesize","500M","--merge-output-format","mp4","-o",path.join(dir,"file.%(ext)s"),"--",url]);
  const t=setTimeout(()=>p.kill("SIGKILL"),18e4);
  p.on("close",code=>{
    clearTimeout(t);const n=fs.readdirSync(dir).find(x=>x.startsWith("file."));
    if(code!==0||!n){done();return send(res,422,{error:"unavailable"})}
    const fp=path.join(dir,n);
    res.writeHead(200,{"Content-Type":"application/octet-stream","Content-Length":fs.statSync(fp).size,"Content-Disposition":`attachment; filename="savelink${path.extname(n)}"`});
    fs.createReadStream(fp).pipe(res);res.on("close",done);
  });
}

http.createServer(async(req,res)=>{
  const u=new URL(req.url,"http://x");
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type"); // lets a page on another host (e.g. Netlify) use this server
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  if(u.pathname.startsWith("/api/")){
    if(limited(ipOf(req)))return send(res,429,{error:"slow down"});
    if(req.method==="POST"&&u.pathname==="/api/download")return info(req,res);
    if(req.method==="GET"&&u.pathname==="/api/file")return file(req,res,u.searchParams);
    return send(res,404,{error:"not found"});
  }
  const p=path.normalize(path.join(PUB,u.pathname==="/"?"index.html":u.pathname));
  if(!p.startsWith(PUB)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end("Not found")}
  res.writeHead(200,{"Content-Type":MIME[path.extname(p)]||"application/octet-stream"});
  fs.createReadStream(p).pipe(res);
}).listen(PORT,()=>console.log("Savelink running on port "+PORT));
