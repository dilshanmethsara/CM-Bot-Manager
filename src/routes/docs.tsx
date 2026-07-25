import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Copy, Check, ChevronRight, Search, Menu, X, Play, Loader2, Globe, Lock, Terminal, BookOpen, Server, MessageSquare, Activity, Key, Webhook, HelpCircle, Wrench } from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "API Docs — Cloud Mint" },
      { name: "description", content: "Complete API documentation for the Cloud Mint WhatsApp Bot Manager." },
    ],
  }),
  component: DocsPage,
});

/* ─── Data ─── */

const apiSections = [
  { id: "intro",      icon: BookOpen,    title: "Introduction" },
  { id: "auth",       icon: Lock,        title: "Authentication" },
  { id: "sessions",   icon: Globe,       title: "Sessions API" },
  { id: "messages",   icon: MessageSquare, title: "Messaging API" },
  { id: "system",     icon: Activity,    title: "System API" },
  { id: "health",     icon: Server,      title: "Health API" },
  { id: "api-keys",   icon: Key,         title: "API Keys" },
  { id: "websockets", icon: Webhook,     title: "WebSockets" },
  { id: "sdk",        icon: Terminal,    title: "SDK Examples" },
  { id: "faq",        icon: HelpCircle,  title: "FAQ" },
  { id: "trouble",    icon: Wrench,      title: "Troubleshooting" },
];

interface EndpointDef {
  section: string;
  method: string;
  path: string;
  desc: string;
  auth: string;
  body?: string;
  response: string;
  error: string;
  curl: string;
  fetch: string;
  axios: string;
  node: string;
  python: string;
  php?: string;
  go?: string;
  csharp?: string;
  java?: string;
  query?: string;
}

const BASE = getApiBaseUrl() || 'http://localhost:3000';

function makeUrl(path: string) {
  return `${BASE}${path}`;
}

function makeCurl(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let cmd = `curl -X ${method} ${url}`;
  if (auth) cmd += ` \\\n  -H "Authorization: Bearer <token>"`;
  if (body) cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
  return cmd;
}

function makeFetch(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `fetch('${url}', {\n  method: '${method}',`;
  if (auth) code += `\n  headers: { 'Authorization': 'Bearer <token>' },`;
  if (body) code += `\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${body})\n}).then(r=>r.json()).then(console.log)`;
  else code += `\n}).then(r=>r.json()).then(console.log)`;
  return code;
}

function makeAxios(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `await axios.${method.toLowerCase()}('${url}'`;
  if (auth || body) {
    code += `, ${body || 'null'}, { headers: { 'Authorization': 'Bearer <token>' } }`;
  }
  code += `);`;
  return code;
}

function makeNode(method: string, path: string, auth?: boolean, body?: string) {
  const urlObj = new URL(makeUrl(path));
  let code = `const http = require('http');\n`;
  code += `const data = ${body ? `JSON.stringify(${body})` : 'null'};\n`;
  code += `const req = http.request({ hostname: '${urlObj.hostname}', port: ${urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)}, path: '${urlObj.pathname}', method: '${method}', headers: {`;
  if (body) code += `'Content-Type': 'application/json', 'Content-Length': data.length`;
  if (auth) code += (body ? ', ' : '') + `'Authorization': 'Bearer <token>'`;
  code += ` } }, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>console.log(JSON.parse(b))); });`;
  if (body) code += `\nreq.write(data);`;
  code += `\nreq.end();`;
  return code;
}

function makePython(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `import requests\n`;
  if (auth) code += `headers = {'Authorization': 'Bearer <token>'}\n`;
  if (body) code += `r = requests.${method.lower()}('${url}', json=${body}`;
  else code += `r = requests.${method.lower()}('${url}'`;
  if (auth) code += `, headers=headers`;
  code += `)\nprint(r.json())`;
  return code;
}

function makePhp(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `$ch = curl_init('${url}');\n`;
  code += `curl_setopt_array($ch, [\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => '${method}',\n`;
  if (body) code += `  CURLOPT_POSTFIELDS => '${body}',\n`;
  if (auth) code += `  CURLOPT_HTTPHEADER => ['Authorization: Bearer <token>', 'Content-Type: application/json'],\n`;
  code += `]);\n$r = curl_exec($ch);\necho $r;`;
  return code;
}

function makeGo(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `package main\nimport ("bytes"; "encoding/json"; "fmt"; "net/http"; "net/url")\nfunc main() {\n`;
  if (body) code += `  b,_:=json.Marshal(${body})\n`;
  code += `  u,_:=url.Parse('${url}')\n`;
  code += `  req,_:=http.NewRequest('${method}', u.String()`;
  if (body) code += `, bytes.NewBuffer(b)`;
  code += `)\n`;
  if (auth) code += `  req.Header.Set('Authorization', 'Bearer <token>')\n`;
  if (body) code += `  req.Header.Set('Content-Type', 'application/json')\n`;
  code += `  r,_:=http.DefaultClient.Do(req)\n  fmt.Println(r)\n}`;
  return code;
}

function makeCSharp(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `using var client = new HttpClient();\n`;
  if (auth) code += `client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "<token>");\n`;
  if (body) {
    code += `var content = new StringContent(JsonSerializer.Serialize(${body}), System.Text.Encoding.UTF8, "application/json");\n`;
    code += `var response = await client.${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}Async("${url}", content);\n`;
  } else {
    code += `var response = await client.${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}Async("${url}");\n`;
  }
  code += `Console.WriteLine(await response.Content.ReadAsStringAsync());`;
  return code;
}

function makeJava(method: string, path: string, auth?: boolean, body?: string) {
  const url = makeUrl(path);
  let code = `HttpClient client = HttpClient.newHttpClient();\n`;
  code += `HttpRequest req = HttpRequest.newBuilder().uri(URI.create("${url}"))\n`;
  code += `  .header("Content-Type", "application/json")\n`;
  if (auth) code += `  .header("Authorization", "Bearer <token>")\n`;
  if (body) code += `  .POST(HttpRequest.BodyPublishers.ofString("${body}"))\n`;
  else code += `  .${method}()\n`;
  code += `  .build();\nclient.send(req, HttpResponse.BodyHandlers.ofString());`;
  return code;
}

const endpoints: EndpointDef[] = [
  /* ── Auth ── */
  { section:"auth", method:"POST", path:"/api/v1/system/auth/login", desc:"Authenticate with email + password to get a session token.",
    auth:"None (public)", body:`{ "email": "admin@dashboard.local", "password": "admin123" }`,
    response:`{ "success": true, "data": { "token": "eyJ...", "user": { "id": "...", "email": "...", "name": "Admin", "role": "admin" } } }`,
    error:`{ "success": false, "error": "Invalid credentials" }`,
    curl:makeCurl("POST", "/api/v1/system/auth/login", false, `{ "email": "admin@dashboard.local", "password": "admin123" }`),
    fetch:makeFetch("POST", "/api/v1/system/auth/login", false, `{ email:'admin@dashboard.local', password:'admin123' }`),
    axios:makeAxios("POST", "/api/v1/system/auth/login", false, `{ email:'admin@dashboard.local', password:'admin123' }`),
    node:makeNode("POST", "/api/v1/system/auth/login", false, `{ email:'admin@dashboard.local', password:'admin123' }`),
    python:makePython("POST", "/api/v1/system/auth/login", false, `{"email":"admin@dashboard.local","password":"admin123"}`),
    php:makePhp("POST", "/api/v1/system/auth/login", false, `{"email":"admin@dashboard.local","password":"admin123"}`),
    go:makeGo("POST", "/api/v1/system/auth/login", false, `{"email":"admin@dashboard.local","password":"admin123"}`),
    csharp:makeCSharp("POST", "/api/v1/system/auth/login", false, `{ email = "admin@dashboard.local", password = "admin123" }`),
    java:makeJava("POST", "/api/v1/system/auth/login", false, `{"email":"admin@dashboard.local","password":"admin123"}`) },

  { section:"auth", method:"POST", path:"/api/v1/system/auth/logout", desc:"Invalidate the current session token.",
    auth:"Bearer token", response:`{ "success": true, "message": "Logged out successfully" }`, error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("POST", "/api/v1/system/auth/logout", true),
    fetch:makeFetch("POST", "/api/v1/system/auth/logout", true),
    axios:makeAxios("POST", "/api/v1/system/auth/logout", true),
    node:makeNode("POST", "/api/v1/system/auth/logout", true),
    python:makePython("POST", "/api/v1/system/auth/logout", true) },

  { section:"auth", method:"GET", path:"/api/v1/system/auth/check", desc:"Check if the current session token is valid.",
    auth:"Bearer token", response:`{ "success": true, "data": { "authenticated": true } }`, error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("GET", "/api/v1/system/auth/check", true),
    fetch:makeFetch("GET", "/api/v1/system/auth/check", true),
    axios:makeAxios("GET", "/api/v1/system/auth/check", true),
    node:makeNode("GET", "/api/v1/system/auth/check", true),
    python:makePython("GET", "/api/v1/system/auth/check", true) },

  { section:"auth", method:"POST", path:"/api/v1/system/auth/password", desc:"Change the dashboard password.",
    auth:"Bearer token", body:`{ "currentPassword": "old123", "newPassword": "new456" }`,
    response:`{ "success": true, "data": { "message": "Password changed successfully" } }`,
    error:`{ "success": false, "error": "New password must be at least 8 characters" }`,
    curl:makeCurl("POST", "/api/v1/system/auth/password", true, `{ "currentPassword": "old123", "newPassword": "new456" }`),
    fetch:makeFetch("POST", "/api/v1/system/auth/password", true, `{ currentPassword:'old123', newPassword:'new456' }`),
    axios:makeAxios("POST", "/api/v1/system/auth/password", true, `{ currentPassword:'old123', newPassword:'new456' }`),
    node:makeNode("POST", "/api/v1/system/auth/password", true, `{ currentPassword:'old123', newPassword:'new456' }`),
    python:makePython("POST", "/api/v1/system/auth/password", true, `{"currentPassword":"old123","newPassword":"new456"}`) },

  /* ── Sessions ── */
  { section:"sessions", method:"GET", path:"/api/v1/sessions", desc:"List all WhatsApp sessions (connected or not).",
    auth:"Bearer token", response:`{ "success": true, "data": [{ "id":"...", "name":"My Bot", "phoneNumber":"94771234567", "status":"connected", "profileName":"My Bot", "connectedAt":"...", "lastActivity":"..." }] }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("GET", "/api/v1/sessions", true),
    fetch:makeFetch("GET", "/api/v1/sessions", true),
    axios:makeAxios("GET", "/api/v1/sessions", true),
    node:makeNode("GET", "/api/v1/sessions", true),
    python:makePython("GET", "/api/v1/sessions", true) },

  { section:"sessions", method:"POST", path:"/api/v1/sessions", desc:"Create a new WhatsApp session.",
    auth:"Bearer token", body:`{ "name": "My Bot", "phoneNumber": "94771234567" }`,
    response:`{ "success": true, "data": { "id": "uuid", "name": "My Bot", "phoneNumber": "94771234567", "status": "disconnected" } }`,
    error:`{ "success": false, "error": "Name is required" }`,
    curl:makeCurl("POST", "/api/v1/sessions", true, `{ "name": "My Bot", "phoneNumber": "94771234567" }`),
    fetch:makeFetch("POST", "/api/v1/sessions", true, `{ name:'My Bot', phoneNumber:'94771234567' }`),
    axios:makeAxios("POST", "/api/v1/sessions", true, `{ name:'My Bot', phoneNumber:'94771234567' }`),
    node:makeNode("POST", "/api/v1/sessions", true, `{ name:'My Bot', phoneNumber:'94771234567' }`),
    python:makePython("POST", "/api/v1/sessions", true, `{"name":"My Bot","phoneNumber":"94771234567"}`) },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/connect", desc:"Connect a session via QR code or pairing code.",
    auth:"Bearer token", body:`{ "method": "qr" }` + "\n" + `{ "method": "pairing" }`,
    response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("POST", "/api/v1/sessions/<id>/connect", true, `{ "method": "qr" }`),
    fetch:makeFetch("POST", "/api/v1/sessions/<id>/connect", true, `{ method:'qr' }`),
    axios:makeAxios("POST", "/api/v1/sessions/<id>/connect", true, `{ method:'qr' }`),
    node:makeNode("POST", "/api/v1/sessions/<id>/connect", true, `{ method:'qr' }`),
    python:makePython("POST", "/api/v1/sessions/<id>/connect", true, `{"method":"qr"}`) },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/disconnect", desc:"Disconnect a WhatsApp session.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("POST", "/api/v1/sessions/<id>/disconnect", true),
    fetch:makeFetch("POST", "/api/v1/sessions/<id>/disconnect", true),
    axios:makeAxios("POST", "/api/v1/sessions/<id>/disconnect", true),
    node:makeNode("POST", "/api/v1/sessions/<id>/disconnect", true),
    python:makePython("POST", "/api/v1/sessions/<id>/disconnect", true) },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/restart", desc:"Restart a session (reconnect WhatsApp).",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("POST", "/api/v1/sessions/<id>/restart", true),
    fetch:makeFetch("POST", "/api/v1/sessions/<id>/restart", true),
    axios:makeAxios("POST", "/api/v1/sessions/<id>/restart", true),
    node:makeNode("POST", "/api/v1/sessions/<id>/restart", true),
    python:makePython("POST", "/api/v1/sessions/<id>/restart", true) },

  { section:"sessions", method:"DELETE", path:"/api/v1/sessions/:id", desc:"Delete a session and all its data.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("DELETE", "/api/v1/sessions/<id>", true),
    fetch:makeFetch("DELETE", "/api/v1/sessions/<id>", true),
    axios:makeAxios("DELETE", "/api/v1/sessions/<id>", true),
    node:makeNode("DELETE", "/api/v1/sessions/<id>", true),
    python:makePython("DELETE", "/api/v1/sessions/<id>", true) },

  { section:"sessions", method:"PATCH", path:"/api/v1/sessions/:id", desc:"Update session metadata (name, phone number, etc).",
    auth:"Bearer token", body:`{ "name": "New Name", "phoneNumber": "94771234567" }`,
    response:`{ "success": true, "data": { "id": "uuid", "name": "New Name" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("PATCH", "/api/v1/sessions/<id>", true, `{ "name": "New Name" }`),
    fetch:makeFetch("PATCH", "/api/v1/sessions/<id>", true, `{ name:'New Name' }`),
    axios:makeAxios("PATCH", "/api/v1/sessions/<id>", true, `{ name:'New Name' }`),
    node:makeNode("PATCH", "/api/v1/sessions/<id>", true, `{ name:'New Name' }`),
    python:makePython("PATCH", "/api/v1/sessions/<id>", true, `{"name":"New Name"}`) },

  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/qr", desc:"Get the QR code for a session (only available during connecting state).",
    auth:"Bearer token", response:`{ "success": true, "data": { "qrCode": "base64..." } }`,
    error:`{ "success": false, "error": "No QR code available for this session" }`,
    curl:makeCurl("GET", "/api/v1/sessions/<id>/qr", true),
    fetch:makeFetch("GET", "/api/v1/sessions/<id>/qr", true),
    axios:makeAxios("GET", "/api/v1/sessions/<id>/qr", true),
    node:makeNode("GET", "/api/v1/sessions/<id>/qr", true),
    python:makePython("GET", "/api/v1/sessions/<id>/qr", true) },

  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/pairing-code", desc:"Get the pairing code for a session (only available during connecting with pairing method).",
    auth:"Bearer token", response:`{ "success": true, "data": { "pairingCode": "ABCD-1234" } }`,
    error:`{ "success": false, "error": "No pairing code available for this session" }`,
    curl:makeCurl("GET", "/api/v1/sessions/<id>/pairing-code", true),
    fetch:makeFetch("GET", "/api/v1/sessions/<id>/pairing-code", true),
    axios:makeAxios("GET", "/api/v1/sessions/<id>/pairing-code", true),
    node:makeNode("GET", "/api/v1/sessions/<id>/pairing-code", true),
    python:makePython("GET", "/api/v1/sessions/<id>/pairing-code", true) },

  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/status", desc:"Realtime session status. Returns current connection state and whether the socket is alive.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id":"...","name":"My Bot","phoneNumber":"94771234567","status":"connected","connected":true,"profileName":"My Bot","lastActivity":"..." } }`,
    error:`{ "success": false, "error": "Session not found" }`,
    curl:makeCurl("GET", "/api/v1/sessions/<id>/status", true),
    fetch:makeFetch("GET", "/api/v1/sessions/<id>/status", true),
    axios:makeAxios("GET", "/api/v1/sessions/<id>/status", true),
    node:makeNode("GET", "/api/v1/sessions/<id>/status", true),
    python:makePython("GET", "/api/v1/sessions/<id>/status", true) },

  /* ── Messages ── */
  { section:"messages", method:"POST", path:"/api/v1/messages/text", desc:"Send a text message via a connected WhatsApp session.",
    auth:"Bearer token", body:`{ "sessionId": "uuid", "to": "94771234567", "content": "Hello from API!" }`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`, error:`{ "success": false, "error": "Session is not connected" }`,
    curl:makeCurl("POST", "/api/v1/messages/text", true, `{ "sessionId": "<id>", "to": "94771234567", "content": "Hello from API!" }`),
    fetch:makeFetch("POST", "/api/v1/messages/text", true, `{ sessionId:'<id>', to:'94771234567', content:'Hello from API!' }`),
    axios:makeAxios("POST", "/api/v1/messages/text", true, `{ sessionId:'<id>', to:'94771234567', content:'Hello from API!' }`),
    node:makeNode("POST", "/api/v1/messages/text", true, `{ sessionId:'<id>', to:'94771234567', content:'Hello from API!' }`),
    python:makePython("POST", "/api/v1/messages/text", true, `{"sessionId":"<id>","to":"94771234567","content":"Hello from API!"}`) },

  { section:"messages", method:"POST", path:"/api/v1/messages/image", desc:"Send an image message. Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), image (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`, error:`{ "success": false, "error": "Image file is required" }`,
    curl:`curl -X POST ${makeUrl("/api/v1/messages/image")} \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "image=@photo.jpg" -F "caption=Look!"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',file); fd.append('caption','Look!');\nfetch('${makeUrl("/api/v1/messages/image")}',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',file);\nawait axios.post('${makeUrl("/api/v1/messages/image")}', fd, {headers:{'Authorization':'Bearer <token>','Content-Type':'multipart/form-data'}})`,
    node:`const FormData = require('form-data'); const fs = require('fs');\nconst fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',fs.createReadStream('photo.jpg'));\nconst req=http.request({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/messages/image',method:'POST',headers:{'Authorization':'Bearer <token>',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'image': open('photo.jpg','rb')}\ndata = {'sessionId':'<id>','to':'94771234567','caption':'Look!'}\nrequests.post('${makeUrl("/api/v1/messages/image")}', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"messages", method:"POST", path:"/api/v1/messages/document", desc:"Send a document message. Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), document (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`, error:`{ "success": false, "error": "Document file is required" }`,
    curl:`curl -X POST ${makeUrl("/api/v1/messages/document")} \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "document=@report.pdf"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',file);\nfetch('${makeUrl("/api/v1/messages/document")}',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',file);\nawait axios.post('${makeUrl("/api/v1/messages/document")}', fd, {headers:{'Authorization':'Bearer <token>'}})`,
    node:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',fs.createReadStream('report.pdf'));\nconst req=http.request({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/messages/document',method:'POST',headers:{'Authorization':'Bearer <token>',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'document': open('report.pdf','rb')}\ndata = {'sessionId':'<id>','to':'94771234567'}\nrequests.post('${makeUrl("/api/v1/messages/document")}', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"messages", method:"POST", path:"/api/v1/messages/media", desc:"Send a generic media message (video, audio, sticker, etc). Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), media (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`, error:`{ "success": false, "error": "Session is not connected" }`,
    curl:`curl -X POST ${makeUrl("/api/v1/messages/media")} \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "media=@video.mp4"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',file);\nfetch('${makeUrl("/api/v1/messages/media")}',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',file);\nawait axios.post('${makeUrl("/api/v1/messages/media")}', fd, {headers:{'Authorization':'Bearer <token>'}})`,
    node:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',fs.createReadStream('video.mp4'));\nconst req=http.request({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/messages/media',method:'POST',headers:{'Authorization':'Bearer <token>',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'media': open('video.mp4','rb')}\ndata = {'sessionId':'<id>','to':'94771234567'}\nrequests.post('${makeUrl("/api/v1/messages/media")}', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  /* ── System ── */
  { section:"system", method:"GET", path:"/api/v1/system/stats", desc:"Get dashboard statistics (session counts, messages, server info).",
    auth:"Bearer token", response:`{ "success": true, "data": { "totalSessions": 4, "activeSessions": 1, "messagesSentToday": 42, "serverStatus": "Operational", "nodeVersion": "v24.18.0" } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("GET", "/api/v1/system/stats", true),
    fetch:makeFetch("GET", "/api/v1/system/stats", true),
    axios:makeAxios("GET", "/api/v1/system/stats", true),
    node:makeNode("GET", "/api/v1/system/stats", true),
    python:makePython("GET", "/api/v1/system/stats", true) },

  { section:"system", method:"GET", path:"/api/v1/system/logs", desc:"Fetch paginated system logs. Supports filtering by level, session, and search.",
    auth:"Bearer token", query:`?page=1&limit=20&level=ERROR&sessionId=<id>&search=keyword`,
    response:`{ "success": true, "data": { "logs": [{ "id":"...","level":"INFO","message":"...","createdAt":"..." }], "pagination": { "page":1, "total":57, "totalPages":29 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "${makeUrl("/api/v1/system/logs")}?page=1&limit=5&level=ERROR" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('${makeUrl("/api/v1/system/logs")}?page=1&limit=5&level=ERROR',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('${makeUrl("/api/v1/system/logs")}',{params:{page:1,limit:5,level:'ERROR'},headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/system/logs?page=1&limit=5&level=ERROR',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)));});`,
    python:`requests.get('${makeUrl("/api/v1/system/logs")}', params={"page":1,"limit":5,"level":"ERROR"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/messages/history", desc:"Fetch paginated message history.",
    auth:"Bearer token", query:`?page=1&limit=20&sessionId=<id>`,
    response:`{ "success": true, "data": { "messages": [{ "id":"...","to":"9477...","type":"text","content":"Hi","status":"sent","createdAt":"..." }], "pagination": { "page":1, "total":42, "totalPages":3 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "${makeUrl("/api/v1/system/messages/history")}?page=1&limit=5" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('${makeUrl("/api/v1/system/messages/history")}?page=1&limit=5',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('${makeUrl("/api/v1/system/messages/history")}',{params:{page:1,limit:5},headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/system/messages/history?page=1&limit=5',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)));});`,
    python:`requests.get('${makeUrl("/api/v1/system/messages/history")}', params={"page":1,"limit":5}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/requests", desc:"Fetch paginated API request log.",
    auth:"Bearer token", query:`?page=1&limit=50`,
    response:`{ "success": true, "data": { "requests": [{ "id":"...","method":"GET","path":"/api/v1/...","statusCode":200,"durationMs":12,"ip":"::1","createdAt":"..." }], "pagination": { "page":1, "total":70, "totalPages":2 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "${makeUrl("/api/v1/system/requests")}?page=1&limit=5" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('${makeUrl("/api/v1/system/requests")}?page=1&limit=5',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('${makeUrl("/api/v1/system/requests")}',{params:{page:1,limit:5},headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'${new URL(BASE).hostname}',port:${new URL(BASE).port||80},path:'/api/v1/system/requests?page=1&limit=5',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)));});`,
    python:`requests.get('${makeUrl("/api/v1/system/requests")}', params={"page":1,"limit":5}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/rate-limits", desc:"Get current rate limit usage (requests/min, messages today, media today).",
    auth:"Bearer token", response:`{ "success": true, "data": { "requestsPerMin": { "used": 5, "cap": 500 }, "messagesPerHour": { "used": 1, "cap": 10000 }, "mediaUploadsPerDay": { "used": 0, "cap": 500 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("GET", "/api/v1/system/rate-limits", true),
    fetch:makeFetch("GET", "/api/v1/system/rate-limits", true),
    axios:makeAxios("GET", "/api/v1/system/rate-limits", true),
    node:makeNode("GET", "/api/v1/system/rate-limits", true),
    python:makePython("GET", "/api/v1/system/rate-limits", true) },

  /* ── Health ── */
  { section:"health", method:"GET", path:"/api/v1/health/", desc:"Public health check endpoint. No authentication required.",
    auth:"None", response:`{ "status": "healthy", "timestamp": "...", "uptime": 256.48, "database": "connected", "whatsapp": { "totalSessions": 4, "connected": 1 } }`,
    error:`never — returns 503 if DB is down`,
    curl:makeCurl("GET", "/api/v1/health/"),
    fetch:makeFetch("GET", "/api/v1/health/"),
    axios:makeAxios("GET", "/api/v1/health/"),
    node:makeNode("GET", "/api/v1/health/"),
    python:makePython("GET", "/api/v1/health/") },

  /* ── API Keys ── */
  { section:"api-keys", method:"GET", path:"/api/v1/system/api-keys", desc:"List all API keys with their associated bot sessions.",
    auth:"Bearer token", response:`{ "success": true, "data": [{ "id":"...","name":"Production","key":"cm_...","sessionId":"...","lastUsed":null,"createdAt":"...","session":{...} }] }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:makeCurl("GET", "/api/v1/system/api-keys", true),
    fetch:makeFetch("GET", "/api/v1/system/api-keys", true),
    axios:makeAxios("GET", "/api/v1/system/api-keys", true),
    node:makeNode("GET", "/api/v1/system/api-keys", true),
    python:makePython("GET", "/api/v1/system/api-keys", true) },

  { section:"api-keys", method:"POST", path:"/api/v1/system/api-keys", desc:"Create a new API key. Optionally scope to a specific session.",
    auth:"Bearer token", body:`{ "name": "Production Bot", "sessionId": "optional-session-uuid" }`,
    response:`{ "success": true, "data": { "id":"...","name":"Production Bot","key":"cm_...","sessionId":"...","session":{...} } }`,
    error:`{ "success": false, "error": "Name is required" }`,
    curl:makeCurl("POST", "/api/v1/system/api-keys", true, `{ "name": "Production Bot" }`),
    fetch:makeFetch("POST", "/api/v1/system/api-keys", true, `{ name:'Production Bot' }`),
    axios:makeAxios("POST", "/api/v1/system/api-keys", true, `{ name:'Production Bot' }`),
    node:makeNode("POST", "/api/v1/system/api-keys", true, `{ name:'Production Bot' }`),
    python:makePython("POST", "/api/v1/system/api-keys", true, `{"name":"Production Bot"}`) },

  { section:"api-keys", method:"DELETE", path:"/api/v1/system/api-keys/:id", desc:"Delete an API key.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Key not found" }`,
    curl:makeCurl("DELETE", "/api/v1/system/api-keys/<id>", true),
    fetch:makeFetch("DELETE", "/api/v1/system/api-keys/<id>", true),
    axios:makeAxios("DELETE", "/api/v1/system/api-keys/<id>", true),
    node:makeNode("DELETE", "/api/v1/system/api-keys/<id>", true),
    python:makePython("DELETE", "/api/v1/system/api-keys/<id>", true) },
];

const realWorldExamples = [
  { title:"Send OTP", sect:"messages", desc:"Send a one-time password to a user's WhatsApp.",
    req:`POST /api/v1/messages/text\nContent-Type: application/json\nAuthorization: Bearer <token>\n\n{\n  "sessionId": "<your-session-id>",\n  "to": "94771234567",\n  "content": "🔐 Your OTP is 123456. Valid for 5 minutes."\n}`,
    res:`{ "success": true, "data": { "messageId": "msg-uuid" } }` },
  { title:"Order Confirmation", sect:"messages", desc:"Send an order confirmation to a customer.",
    req:`POST /api/v1/messages/text\nContent-Type: application/json\nAuthorization: Bearer <token>\n\n{\n  "sessionId": "<your-session-id>",\n  "to": "94771234567",\n  "content": "🛒 Order #1234 confirmed!\\nItems: 2x Widget Pro\\nTotal: $49.99\\nDelivery: Dec 25\\n\\nThank you for your purchase!"\n}`,
    res:`{ "success": true, "data": { "messageId": "msg-uuid" } }` },
  { title:"Notification", sect:"messages", desc:"Send a broadcast notification.",
    req:`POST /api/v1/messages/text\nContent-Type: application/json\nAuthorization: Bearer <token>\n\n{\n  "sessionId": "<your-session-id>",\n  "to": "94771234567",\n  "content": "📢 Important Update: Our system will be under maintenance tonight from 2-4 AM. Apologies for any inconvenience."\n}`,
    res:`{ "success": true, "data": { "messageId": "msg-uuid" } }` },
  { title:"Password Reset", sect:"messages", desc:"Send a password reset link via WhatsApp.",
    req:`POST /api/v1/messages/text\nContent-Type: application/json\nAuthorization: Bearer <token>\n\n{\n  "sessionId": "<your-session-id>",\n  "to": "94771234567",\n  "content": "🔑 Password reset requested. Click here:\\nhttps://example.com/reset?token=abc123\\n\\nIf you did not request this, ignore this message."\n}`,
    res:`{ "success": true, "data": { "messageId": "msg-uuid" } }` },
  { title:"Welcome Message", sect:"messages", desc:"Send a welcome message to a new user.",
    req:`POST /api/v1/messages/text\nContent-Type: application/json\nAuthorization: Bearer <token>\n\n{\n  "sessionId": "<your-session-id>",\n  "to": "94771234567",\n  "content": "👋 Welcome to Cloud Mint! 🎉\\n\\nWe're excited to have you on board. Reply HELP to see what I can do for you."\n}`,
    res:`{ "success": true, "data": { "messageId": "msg-uuid" } }` },
];

/* ─── Component ─── */

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);
  return (
    <div className="group relative my-2 overflow-hidden rounded-xl border border-border bg-[oklch(0.12_0.02_240)]">
      <button onClick={copy} className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-muted-foreground opacity-0 transition-opacity hover:bg-white/10 hover:text-foreground group-hover:opacity-100">
        {copied ? <Check className="h-3.5 w-3.5 text-[oklch(0.85_0.17_155)]" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-[oklch(0.9_0.02_200)]"><code>{code}</code></pre>
    </div>
  );
}

function Badge({ variant, children }: { variant: 'get'|'post'|'delete'|'patch'|'info'; children: React.ReactNode }) {
  const colors: Record<string,string> = { get:'bg-accent/15 text-accent', post:'bg-[oklch(0.78_0.17_155)]/15 text-[oklch(0.85_0.17_155)]', delete:'bg-destructive/15 text-destructive', patch:'bg-[oklch(0.86_0.16_80)]/15 text-[oklch(0.86_0.16_80)]', info:'bg-muted text-muted-foreground' };
  return <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${colors[variant]}`}>{children}</span>;
}

function EndpointCard({ ep }: { ep: EndpointDef }) {
  const [tab, setTab] = useState<'curl'|'fetch'|'axios'|'node'|'python'|'go'|'csharp'|'java'|'php'>('curl');
  const methodColor = ep.method === 'GET' ? 'get' : ep.method === 'POST' ? 'post' : ep.method === 'DELETE' ? 'delete' : 'patch';
  const examples: Record<string, string> = { curl: ep.curl, fetch: ep.fetch, axios: ep.axios, node: ep.node, python: ep.python, php: ep.php||'', go: ep.go||'', csharp: ep.csharp||'', java: ep.java||'' };
  return (
    <div id={`endpoint-${ep.section}-${ep.method}-${ep.path.replace(/[^a-zA-Z0-9]/g,'-')}`} className="scroll-mt-24 rounded-2xl border border-border bg-card/40 p-5 transition hover:border-primary/30">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={methodColor}>{ep.method}</Badge>
        <code className="font-mono text-sm font-semibold">{ep.path}</code>
        <span className="text-xs text-muted-foreground">{ep.auth}</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{ep.desc}</p>

      {ep.body && <><h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request Body</h5><CodeBlock code={ep.body} /></>}
      {ep.query && <><h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query Parameters</h5><CodeBlock code={ep.query} /></>}

      <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h5>
      <CodeBlock code={ep.response} />

      <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Error Response</h5>
      <CodeBlock code={ep.error} />

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap gap-1">
          {Object.keys(examples).filter(k => examples[k]).map(l => (
            <button key={l} onClick={() => setTab(l as any)} className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${tab===l?'bg-accent/20 text-accent':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{l}</button>
          ))}
        </div>
        <CodeBlock code={examples[tab]} />
      </div>
    </div>
  );
}

/* Try It Panel — GET endpoints only (safe) */
const tryEndpoints = ["/api/v1/health/","/api/v1/system/stats","/api/v1/system/rate-limits"];
function TryItPanel({ ep }: { ep: EndpointDef }) {
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const needsAuth = ep.auth !== "None";

  const tryIt = async () => {
    setLoading(true); setResult(null);
    try {
      const headers: Record<string,string> = {};
      if (needsAuth) headers['Authorization'] = `Bearer ${token}`;
      const base = BASE;
      const path = ep.path.replace(/:id/g,'');
      const res = await fetch(`${base}${path}`, { headers });
      const text = await res.text();
      setResult(text);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 rounded-xl border border-[oklch(0.78_0.17_155)]/25 bg-[oklch(0.78_0.17_155)]/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Play className="h-4 w-4 text-[oklch(0.85_0.17_155)]" />
        <span className="text-sm font-semibold">Try it</span>
        <span className="text-[10px] text-muted-foreground">(read-only GET)</span>
      </div>
      {needsAuth && (
        <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Bearer token (from login)" className="mb-2 w-full rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-mono outline-none focus:border-accent" />
      )}
      <div className="flex gap-2">
        <button onClick={tryIt} disabled={loading} className="rounded-lg bg-[image:var(--gradient-primary)] px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Send Request"}
        </button>
      </div>
      {result !== null && <CodeBlock code={result} />}
    </div>
  );
}

function DocsPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery ? endpoints.filter(e =>
    e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.desc.toLowerCase().includes(searchQuery.toLowerCase())
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-card/80 backdrop-blur-xl transition-transform lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <nav className="overflow-y-auto p-3" style={{height:'calc(100% - 3.5rem)'}}>
          {apiSections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => { setActiveSection(s.id); setMobileOpen(false); }} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${activeSection===s.id?'bg-accent/15 text-accent font-semibold':'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {s.title}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu button */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed bottom-4 right-4 z-30 rounded-xl bg-[image:var(--gradient-primary)] p-3 text-primary-foreground shadow-lg">
        <Menu className="h-6 w-6" />
      </button>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
            <p className="text-muted-foreground">Complete reference for the Cloud Mint WhatsApp Bot Manager REST API.</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">Base URL:</span>
              <code className="rounded-lg bg-muted px-2 py-1 text-xs font-mono text-primary">{BASE}</code>
              <span className="text-xs text-muted-foreground">(auto-detected from current domain)</span>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search endpoints..." className="w-full rounded-lg border border-border bg-card/60 pl-10 pr-4 py-2 text-sm outline-none focus:border-accent" />
            </div>
          </header>

          {/* Sections */}
          {(filtered ?? endpoints).filter(e => e.section === activeSection).map(ep => (
            <EndpointCard key={`${ep.section}-${ep.method}-${ep.path}`} ep={ep} />
          ))}

          {activeSection === "sdk" && (
            <div className="space-y-6">
              {realWorldExamples.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card/40 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="post">{ex.sect}</Badge>
                    <h4 className="font-semibold">{ex.title}</h4>
                    <p className="text-sm text-muted-foreground">{ex.desc}</p>
                  </div>
                  <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request</h5>
                  <CodeBlock code={ex.req} />
                  <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</h5>
                  <CodeBlock code={ex.res} />
                </div>
              ))}
            </div>
          )}

          {activeSection === "faq" && (
            <div className="space-y-4">
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">How do I authenticate?</summary>
                <p className="mt-2 text-sm text-muted-foreground">Call <code className="font-mono">POST /api/v1/system/auth/login</code> with email and password. Use the returned token as <code className="font-mono">Authorization: Bearer {"<token>"}</code>.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">What's the difference between QR and pairing?</summary>
                <p className="mt-2 text-sm text-muted-foreground">QR code: Scan with WhatsApp → Linked Devices. Pairing code: Enter phone number in WhatsApp → enter 8-digit code. Both link the same session.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">How do I send a message?</summary>
                <p className="mt-2 text-sm text-muted-foreground">Use <code className="font-mono">POST /api/v1/messages/text</code> with <code className="font-mono">sessionId</code>, <code className="font-mono">to</code> (phone), and <code className="font-mono">content</code>.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">How do I use API keys?</summary>
                <p className="mt-2 text-sm text-muted-foreground">Create a key in API Manager. Use <code className="font-mono">Authorization: Bearer cm_{"<key>"}</code> instead of session token. Keys can be scoped to one bot.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">What are the rate limits?</summary>
                <p className="mt-2 text-sm text-muted-foreground">Default: 500 req/min, 10,000 msgs/hour, 500 media/day. Check <code className="font-mono">GET /api/v1/system/rate-limits</code> for current usage.</p>
              </details>
            </div>
          )}

          {activeSection === "trouble" && (
            <div className="space-y-4">
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">Session stuck in "connecting"</summary>
                <p className="mt-2 text-sm text-muted-foreground">Restart the session: <code className="font-mono">POST /api/v1/sessions/:id/restart</code>. Check server logs for Baileys errors.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">QR code not showing</summary>
                <p className="mt-2 text-sm text-muted-foreground">Ensure session status is "qr". Call <code className="font-mono">GET /api/v1/sessions/:id/qr</code>. If empty, restart session.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">Pairing code not working</summary>
                <p className="mt-2 text-sm text-muted-foreground">Phone number must include country code without + (e.g., 94771234567). Pairing codes expire in ~20 seconds.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">WebSocket connection fails</summary>
                <p className="mt-2 text-sm text-muted-foreground">Check nginx config has WebSocket proxy headers. Ensure <code className="font-mono">/socket.io/</code> location proxies with upgrade headers.</p>
              </details>
              <details className="rounded-xl border border-border bg-card/40 p-4">
                <summary className="font-semibold cursor-pointer">Database connection errors</summary>
                <p className="mt-2 text-sm text-muted-foreground">Verify DATABASE_URL in .env. Neon requires sslmode=require. Run <code className="font-mono">npx prisma migrate deploy</code> after schema changes.</p>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
