import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Copy, Check, ChevronRight, Search, Menu, X, Play, Loader2, Globe, Lock, Terminal, BookOpen, Server, MessageSquare, Activity, Key, Webhook, HelpCircle, Wrench } from "lucide-react";

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

const endpoints: EndpointDef[] = [
  /* ── Auth ── */
  { section:"auth", method:"POST", path:"/api/v1/system/auth/login", desc:"Authenticate with email + password to get a session token.",
    auth:"None (public)", body:`{ "email": "admin@dashboard.local", "password": "admin123" }`,
    response:`{ "success": true, "data": { "token": "eyJ...", "user": { "id": "...", "email": "...", "name": "Admin", "role": "admin" } } }`,
    error:`{ "success": false, "error": "Invalid credentials" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/system/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"admin@dashboard.local","password":"admin123"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/system/auth/login', {\n  method:'POST',\n  headers:{'Content-Type':'application/json'},\n  body: JSON.stringify({email:'admin@dashboard.local',password:'admin123'})\n}).then(r=>r.json()).then(console.log)`,
    axios:`const res = await axios.post('http://localhost:3000/api/v1/system/auth/login', {\n  email:'admin@dashboard.local',\n  password:'admin123'\n}); console.log(res.data);`,
    node:`const http = require('http');\nconst data = JSON.stringify({email:'admin@dashboard.local',password:'admin123'});\nconst req = http.request({hostname:'localhost',port:3000,path:'/api/v1/system/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':data.length}}, res => {\n  let b=''; res.on('data',c=>b+=c); res.on('end',()=>console.log(JSON.parse(b)));\n}); req.write(data); req.end();`,
    python:`import requests\nr = requests.post('http://localhost:3000/api/v1/system/auth/login', json={"email":"admin@dashboard.local","password":"admin123"})\nprint(r.json())`,
    php:`$r = http_post_fields('http://localhost:3000/api/v1/system/auth/login', json_encode(['email'=>'admin@dashboard.local','password'=>'admin123']));\necho $r;`,
    go:`package main\nimport ("bytes";"encoding/json";"fmt";"net/http")\nfunc main() {\n  b,_:=json.Marshal(map[string]string{"email":"admin@dashboard.local","password":"admin123"})\n  r,_:=http.Post("http://localhost:3000/api/v1/system/auth/login","application/json",bytes.NewBuffer(b))\n  fmt.Println(r)\n}`,
    csharp:`using var client = new HttpClient();\nvar content = new StringContent(JsonSerializer.Serialize(new { email = "admin@dashboard.local", password = "admin123" }), Encoding.UTF8, "application/json");\nvar response = await client.PostAsync("http://localhost:3000/api/v1/system/auth/login", content);\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`,
    java:`HttpClient client = HttpClient.newHttpClient();\nHttpRequest req = HttpRequest.newBuilder().uri(URI.create("http://localhost:3000/api/v1/system/auth/login")).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString("{\\"email\\":\\"admin@dashboard.local\\",\\"password\\":\\"admin123\\"}")).build();\nclient.send(req, HttpResponse.BodyHandlers.ofString());` },

  { section:"auth", method:"POST", path:"/api/v1/system/auth/logout", desc:"Invalidate the current session token.",
    auth:"Bearer token", response:`{ "success": true, "message": "Logged out successfully" }`, error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/system/auth/logout \\\n  -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/auth/logout',{method:'POST',headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json()).then(console.log)`,
    axios:`await axios.post('http://localhost:3000/api/v1/system/auth/logout', null, {headers:{Authorization:'Bearer <token>'}})`,
    node:`const req = http.request({hostname:'localhost',port:3000,path:'/api/v1/system/auth/logout',method:'POST',headers:{'Authorization':'Bearer <token>'}}); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/system/auth/logout', headers={'Authorization':'Bearer <token>'})` },

  { section:"auth", method:"GET", path:"/api/v1/system/auth/check", desc:"Check if the current session token is valid.",
    auth:"Bearer token", response:`{ "success": true, "data": { "authenticated": true } }`, error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl http://localhost:3000/api/v1/system/auth/check -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/auth/check',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json()).then(console.log)`,
    axios:`const {data} = await axios.get('http://localhost:3000/api/v1/system/auth/check',{headers:{Authorization:'Bearer <token>'}});`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/auth/check',headers:{'Authorization':'Bearer <token>'}}, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>console.log(JSON.parse(b))); });`,
    python:`requests.get('http://localhost:3000/api/v1/system/auth/check', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"auth", method:"POST", path:"/api/v1/system/auth/password", desc:"Change the dashboard password.",
    auth:"Bearer token", body:`{ "currentPassword": "old123", "newPassword": "new456" }`,
    response:`{ "success": true, "data": { "message": "Password changed successfully" } }`,
    error:`{ "success": false, "error": "New password must be at least 8 characters" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/system/auth/password \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"currentPassword":"old123","newPassword":"new456"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/system/auth/password',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({currentPassword:'old123',newPassword:'new456'})}).then(r=>r.json()).then(console.log)`,
    axios:`await axios.post('http://localhost:3000/api/v1/system/auth/password',{currentPassword:'old123',newPassword:'new456'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({currentPassword:'old123',newPassword:'new456'});\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/system/auth/password',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}}); req.write(d); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/system/auth/password', json={"currentPassword":"old123","newPassword":"new456"}, headers={'Authorization':'Bearer <token>'})` },

  /* ── Sessions ── */
  { section:"sessions", method:"GET", path:"/api/v1/sessions", desc:"List all WhatsApp sessions (connected or not).",
    auth:"Bearer token", response:`{ "success": true, "data": [{ "id":"...", "name":"My Bot", "phoneNumber":"94771234567", "status":"connected", "profileName":"My Bot", "connectedAt":"...", "lastActivity":"..." }] }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl http://localhost:3000/api/v1/sessions -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json()).then(console.log)`,
    axios:`const {data} = await axios.get('http://localhost:3000/api/v1/sessions',{headers:{Authorization:'Bearer <token>'}});`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/sessions',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)));});`,
    python:`requests.get('http://localhost:3000/api/v1/sessions', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"POST", path:"/api/v1/sessions", desc:"Create a new WhatsApp session.",
    auth:"Bearer token", body:`{ "name": "My Bot", "phoneNumber": "94771234567" }`,
    response:`{ "success": true, "data": { "id": "uuid", "name": "My Bot", "phoneNumber": "94771234567", "status": "disconnected" } }`,
    error:`{ "success": false, "error": "Name is required" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/sessions \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"name":"My Bot","phoneNumber":"94771234567"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({name:'My Bot',phoneNumber:'94771234567'})}).then(r=>r.json()).then(console.log)`,
    axios:`await axios.post('http://localhost:3000/api/v1/sessions',{name:'My Bot',phoneNumber:'94771234567'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({name:'My Bot',phoneNumber:'94771234567'});\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))}); req.write(d); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/sessions', json={"name":"My Bot","phoneNumber":"94771234567"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/connect", desc:"Connect a session via QR code or pairing code.",
    auth:"Bearer token", body:`{ "method": "qr" }` + "\n" + `{ "method": "pairing" }`,
    response:`{ "success": true, "data": { "id": "uuid" } }`,
    error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/sessions/<id>/connect \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"method":"qr"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/connect',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({method:'qr'})}).then(r=>r.json()).then(console.log)`,
    axios:`await axios.post('http://localhost:3000/api/v1/sessions/<id>/connect',{method:'qr'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({method:'qr'});\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/connect',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}}); req.write(d); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/sessions/<id>/connect', json={"method":"qr"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/disconnect", desc:"Disconnect a WhatsApp session.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/sessions/<id>/disconnect -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/disconnect',{method:'POST',headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.post('http://localhost:3000/api/v1/sessions/<id>/disconnect',null,{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/disconnect',method:'POST',headers:{'Authorization':'Bearer <token>'}}).end();`,
    python:`requests.post('http://localhost:3000/api/v1/sessions/<id>/disconnect', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"POST", path:"/api/v1/sessions/:id/restart", desc:"Restart a session (reconnect WhatsApp).",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/sessions/<id>/restart -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/restart',{method:'POST',headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.post('http://localhost:3000/api/v1/sessions/<id>/restart',null,{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/restart',method:'POST',headers:{'Authorization':'Bearer <token>'}}).end();`,
    python:`requests.post('http://localhost:3000/api/v1/sessions/<id>/restart', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"DELETE", path:"/api/v1/sessions/:id", desc:"Delete a session and all its data.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl -X DELETE http://localhost:3000/api/v1/sessions/<id> -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>',{method:'DELETE',headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.delete('http://localhost:3000/api/v1/sessions/<id>',{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>',method:'DELETE',headers:{'Authorization':'Bearer <token>'}}).end();`,
    python:`requests.delete('http://localhost:3000/api/v1/sessions/<id>', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"PATCH", path:"/api/v1/sessions/:id", desc:"Update session metadata (name, phone number, etc).",
    auth:"Bearer token", body:`{ "name": "New Name", "phoneNumber": "94771234567" }`,
    response:`{ "success": true, "data": { "id": "uuid", "name": "New Name" } }`, error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl -X PATCH http://localhost:3000/api/v1/sessions/<id> \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"name":"New Name"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({name:'New Name'})}).then(r=>r.json())`,
    axios:`await axios.patch('http://localhost:3000/api/v1/sessions/<id>',{name:'New Name'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({name:'New Name'}); const req=http.request({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>',method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}}); req.write(d); req.end();`,
    python:`requests.patch('http://localhost:3000/api/v1/sessions/<id>', json={"name":"New Name"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/qr", desc:"Get the QR code for a session (only available during connecting state).",
    auth:"Bearer token", response:`{ "success": true, "data": { "qrCode": "base64..." } }`,
    error:`{ "success": false, "error": "No QR code available for this session" }`,
    curl:`curl http://localhost:3000/api/v1/sessions/<id>/qr -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/qr',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`const {data} = await axios.get('http://localhost:3000/api/v1/sessions/<id>/qr',{headers:{Authorization:'Bearer <token>'}});`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/qr',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/sessions/<id>/qr', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/pairing-code", desc:"Get the pairing code for a session (only available during connecting with pairing method).",
    auth:"Bearer token", response:`{ "success": true, "data": { "pairingCode": "ABCD-1234" } }`,
    error:`{ "success": false, "error": "No pairing code available for this session" }`,
    curl:`curl http://localhost:3000/api/v1/sessions/<id>/pairing-code -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/pairing-code',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/sessions/<id>/pairing-code',{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/pairing-code',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/sessions/<id>/pairing-code', headers={'Authorization':'Bearer <token>'}).json()` },
  { section:"sessions", method:"GET", path:"/api/v1/sessions/:id/status", desc:"Realtime session status. Returns current connection state and whether the socket is alive.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id":"...","name":"My Bot","phoneNumber":"94771234567","status":"connected","connected":true,"profileName":"My Bot","lastActivity":"..." } }`,
    error:`{ "success": false, "error": "Session not found" }`,
    curl:`curl http://localhost:3000/api/v1/sessions/<id>/status -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/sessions/<id>/status',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/sessions/<id>/status',{headers:{Authorization:'Bearer <token>'}}).then(r=>r.data)`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/sessions/<id>/status',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/sessions/<id>/status', headers={'Authorization':'Bearer <token>'}).json()` },

  /* ── Messages ── */
  { section:"messages", method:"POST", path:"/api/v1/messages/text", desc:"Send a text message via a connected WhatsApp session.",
    auth:"Bearer token", body:`{ "sessionId": "uuid", "to": "94771234567", "content": "Hello from API!" }`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`,
    error:`{ "success": false, "error": "Session is not connected" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/messages/text \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"sessionId":"<id>","to":"94771234567","content":"Hello from API!"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/messages/text',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({sessionId:'<id>',to:'94771234567',content:'Hello from API!'})}).then(r=>r.json())`,
    axios:`await axios.post('http://localhost:3000/api/v1/messages/text',{sessionId:'<id>',to:'94771234567',content:'Hello from API!'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({sessionId:'<id>',to:'94771234567',content:'Hello from API!'});\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/messages/text',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))}); req.write(d); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/messages/text', json={"sessionId":"<id>","to":"94771234567","content":"Hello from API!"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"messages", method:"POST", path:"/api/v1/messages/image", desc:"Send an image message. Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), image (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`,
    error:`{ "success": false, "error": "Image file is required" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/messages/image \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "image=@photo.jpg" -F "caption=Look!"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',file); fd.append('caption','Look!');\nfetch('http://localhost:3000/api/v1/messages/image',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',file);\nawait axios.post('http://localhost:3000/api/v1/messages/image', fd, {headers:{'Authorization':'Bearer <token>','Content-Type':'multipart/form-data'}})`,
    node:`const FormData = require('form-data'); const fs = require('fs');\nconst fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('image',fs.createReadStream('photo.jpg'));\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/messages/image',method:'POST',headers:{'Authorization':'Bearer <token',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'image': open('photo.jpg','rb')}\ndata = {'sessionId':'<id>','to':'94771234567','caption':'Look!'}\nrequests.post('http://localhost:3000/api/v1/messages/image', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"messages", method:"POST", path:"/api/v1/messages/document", desc:"Send a document message. Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), document (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`,
    error:`{ "success": false, "error": "Document file is required" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/messages/document \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "document=@report.pdf"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',file);\nfetch('http://localhost:3000/api/v1/messages/document',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',file);\nawait axios.post('http://localhost:3000/api/v1/messages/document', fd, {headers:{'Authorization':'Bearer <token>'}})`,
    node:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('document',fs.createReadStream('report.pdf'));\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/messages/document',method:'POST',headers:{'Authorization':'Bearer <token',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'document': open('report.pdf','rb')}\ndata = {'sessionId':'<id>','to':'94771234567'}\nrequests.post('http://localhost:3000/api/v1/messages/document', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"messages", method:"POST", path:"/api/v1/messages/media", desc:"Send a generic media message (video, audio, sticker, etc). Uses multipart/form-data.",
    auth:"Bearer token", body:`FormData with fields: sessionId (string), to (string), media (file), caption? (string)`,
    response:`{ "success": true, "data": { "messageId": "uuid" } }`,
    error:`{ "success": false, "error": "Session is not connected" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/messages/media \\\n  -H "Authorization: Bearer <token>" \\\n  -F "sessionId=<id>" -F "to=94771234567" -F "media=@video.mp4"`,
    fetch:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',file);\nfetch('http://localhost:3000/api/v1/messages/media',{method:'POST',headers:{'Authorization':'Bearer <token>'},body:fd}).then(r=>r.json())`,
    axios:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',file);\nawait axios.post('http://localhost:3000/api/v1/messages/media', fd, {headers:{'Authorization':'Bearer <token>'}})`,
    node:`const fd = new FormData(); fd.append('sessionId','<id>'); fd.append('to','94771234567'); fd.append('media',fs.createReadStream('video.mp4'));\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/messages/media',method:'POST',headers:{'Authorization':'Bearer <token',...fd.getHeaders()}}); fd.pipe(req);`,
    python:`files = {'media': open('video.mp4','rb')}\ndata = {'sessionId':'<id>','to':'94771234567'}\nrequests.post('http://localhost:3000/api/v1/messages/media', data=data, files=files, headers={'Authorization':'Bearer <token>'}).json()` },

  /* ── System ── */
  { section:"system", method:"GET", path:"/api/v1/system/stats", desc:"Get dashboard statistics (session counts, messages, server info).",
    auth:"Bearer token", response:`{ "success": true, "data": { "totalSessions": 4, "activeSessions": 1, "messagesSentToday": 42, "serverStatus": "Operational", "nodeVersion": "v24.18.0" } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl http://localhost:3000/api/v1/system/stats -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/stats',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`const {data}=await axios.get('http://localhost:3000/api/v1/system/stats',{headers:{Authorization:'Bearer <token>'}});`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/stats',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/stats', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/logs", desc:"Fetch paginated system logs. Supports filtering by level, session, and search.",
    auth:"Bearer token", query:`?page=1&limit=20&level=ERROR&sessionId=<id>&search=keyword`,
    response:`{ "success": true, "data": { "logs": [{ "id":"...","level":"INFO","message":"...","createdAt":"..." }], "pagination": { "page":1, "total":57, "totalPages":29 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "http://localhost:3000/api/v1/system/logs?page=1&limit=5&level=ERROR" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/logs?page=1&limit=5&level=ERROR',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`const {data}=await axios.get('http://localhost:3000/api/v1/system/logs',{params:{page:1,limit:5,level:'ERROR'},headers:{Authorization:'Bearer <token>'}});`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/logs?page=1&limit=5&level=ERROR',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/logs', params={"page":1,"limit":5,"level":"ERROR"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/messages/history", desc:"Fetch paginated message history.",
    auth:"Bearer token", query:`?page=1&limit=20&sessionId=<id>`,
    response:`{ "success": true, "data": { "messages": [{ "id":"...","to":"9477...","type":"text","content":"Hi","status":"sent","createdAt":"..." }], "pagination": { "page":1, "total":42, "totalPages":3 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "http://localhost:3000/api/v1/system/messages/history?page=1&limit=5" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/messages/history?page=1&limit=5',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/system/messages/history',{params:{page:1,limit:5},headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/messages/history?page=1&limit=5',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/messages/history', params={"page":1,"limit":5}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/requests", desc:"Fetch paginated API request log.",
    auth:"Bearer token", query:`?page=1&limit=50`,
    response:`{ "success": true, "data": { "requests": [{ "id":"...","method":"GET","path":"/api/v1/...","statusCode":200,"durationMs":12,"ip":"::1","createdAt":"..." }], "pagination": { "page":1, "total":70, "totalPages":2 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl "http://localhost:3000/api/v1/system/requests?page=1&limit=5" -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/requests?page=1&limit=5',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/system/requests',{params:{page:1,limit:5},headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/requests?page=1&limit=5',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/requests', params={"page":1,"limit":5}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"system", method:"GET", path:"/api/v1/system/rate-limits", desc:"Get current rate limit usage (requests/min, messages today, media today).",
    auth:"Bearer token", response:`{ "success": true, "data": { "requestsPerMin": { "used": 5, "cap": 500 }, "messagesPerHour": { "used": 1, "cap": 10000 }, "mediaUploadsPerDay": { "used": 0, "cap": 500 } } }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl http://localhost:3000/api/v1/system/rate-limits -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/rate-limits',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/system/rate-limits',{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/rate-limits',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/rate-limits', headers={'Authorization':'Bearer <token>'}).json()` },

  /* ── Health ── */
  { section:"health", method:"GET", path:"/api/v1/health/", desc:"Public health check endpoint. No authentication required.",
    auth:"None", response:`{ "status": "healthy", "timestamp": "...", "uptime": 256.48, "database": "connected", "whatsapp": { "totalSessions": 4, "connected": 1 } }`,
    error:`never — returns 503 if DB is down`,
    curl:`curl http://localhost:3000/api/v1/health/`,
    fetch:`fetch('http://localhost:3000/api/v1/health/').then(r=>r.json()).then(console.log)`,
    axios:`const {data}=await axios.get('http://localhost:3000/api/v1/health/');`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/health/'},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/health/').json()` },

  /* ── API Keys ── */
  { section:"api-keys", method:"GET", path:"/api/v1/system/api-keys", desc:"List all API keys with their associated bot sessions.",
    auth:"Bearer token", response:`{ "success": true, "data": [{ "id":"...","name":"Production","key":"cm_...","sessionId":"...","lastUsed":null,"createdAt":"...","session":{...} }] }`,
    error:`{ "success": false, "error": "No token provided" }`,
    curl:`curl http://localhost:3000/api/v1/system/api-keys -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/api-keys',{headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.get('http://localhost:3000/api/v1/system/api-keys',{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.get({hostname:'localhost',port:3000,path:'/api/v1/system/api-keys',headers:{'Authorization':'Bearer <token>'}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))});`,
    python:`requests.get('http://localhost:3000/api/v1/system/api-keys', headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"api-keys", method:"POST", path:"/api/v1/system/api-keys", desc:"Create a new API key. Optionally scope to a specific session.",
    auth:"Bearer token", body:`{ "name": "Production Bot", "sessionId": "optional-session-uuid" }`,
    response:`{ "success": true, "data": { "id":"...","name":"Production Bot","key":"cm_...","sessionId":"...","session":{...} } }`,
    error:`{ "success": false, "error": "Name is required" }`,
    curl:`curl -X POST http://localhost:3000/api/v1/system/api-keys \\\n  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \\\n  -d '{"name":"Production Bot"}'`,
    fetch:`fetch('http://localhost:3000/api/v1/system/api-keys',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>'},body:JSON.stringify({name:'Production Bot'})}).then(r=>r.json())`,
    axios:`await axios.post('http://localhost:3000/api/v1/system/api-keys',{name:'Production Bot'},{headers:{Authorization:'Bearer <token>'}})`,
    node:`const d=JSON.stringify({name:'Production Bot'});\nconst req=http.request({hostname:'localhost',port:3000,path:'/api/v1/system/api-keys',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer <token>','Content-Length':d.length}},res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(JSON.parse(b)))}); req.write(d); req.end();`,
    python:`requests.post('http://localhost:3000/api/v1/system/api-keys', json={"name":"Production Bot"}, headers={'Authorization':'Bearer <token>'}).json()` },

  { section:"api-keys", method:"DELETE", path:"/api/v1/system/api-keys/:id", desc:"Delete an API key.",
    auth:"Bearer token", response:`{ "success": true, "data": { "id": "uuid" } }`, error:`{ "success": false, "error": "Key not found" }`,
    curl:`curl -X DELETE http://localhost:3000/api/v1/system/api-keys/<id> -H "Authorization: Bearer <token>"`,
    fetch:`fetch('http://localhost:3000/api/v1/system/api-keys/<id>',{method:'DELETE',headers:{'Authorization':'Bearer <token>'}}).then(r=>r.json())`,
    axios:`await axios.delete('http://localhost:3000/api/v1/system/api-keys/<id>',{headers:{Authorization:'Bearer <token>'}})`,
    node:`http.request({hostname:'localhost',port:3000,path:'/api/v1/system/api-keys/<id>',method:'DELETE',headers:{'Authorization':'Bearer <token>'}}).end();`,
    python:`requests.delete('http://localhost:3000/api/v1/system/api-keys/<id>', headers={'Authorization':'Bearer <token>'}).json()` },
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
      const base = 'http://localhost:3000';
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
                <span>{s.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Content */}
      <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">
        {/* Mobile menu */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground"><Menu className="h-5 w-5" /></button>
          <input type="text" placeholder="Search endpoints…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="flex-1 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>

        {searchQuery ? (
          <>
            <h1 className="mb-6 text-2xl font-bold">Search Results</h1>
            {filtered?.length ? filtered.map(ep => <div key={ep.path+ep.method} className="mb-4"><EndpointCard ep={ep} /></div>) : <p className="text-muted-foreground">No results for "{searchQuery}"</p>}
          </>
        ) : (
          <>
            {activeSection === "intro" && (
              <>
                <h1 className="mb-2 text-3xl font-bold tracking-tight">Cloud Mint API</h1>
                <p className="mb-8 text-muted-foreground">Send and receive WhatsApp messages programmatically. Manage sessions, send messages, and monitor your bots.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="mb-1 font-semibold">Base URL</h3><code className="text-xs text-accent">http://localhost:3000/api/v1</code></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="mb-1 font-semibold">Auth</h3><p className="text-xs text-muted-foreground">Bearer token or HTTP-only cookie</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="mb-1 font-semibold">Rate Limits</h3><p className="text-xs text-muted-foreground">500 req/min, 10k msg/day, 500 media/day</p></div>
                </div>

                <h2 className="mb-4 mt-8 text-xl font-bold">Quick Start</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">1. Login</strong> — <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /api/v1/system/auth/login</code> with email + password to get a token.</p>
                  <p><strong className="text-foreground">2. Create a session</strong> — <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /api/v1/sessions</code> with a name and phone number.</p>
                  <p><strong className="text-foreground">3. Connect</strong> — <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /api/v1/sessions/:id/connect</code> with method <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">"qr"</code> or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">"pairing"</code>.</p>
                  <p><strong className="text-foreground">4. Scan QR / Enter pairing code</strong> on your WhatsApp mobile app.</p>
                  <p><strong className="text-foreground">5. Send messages</strong> — <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /api/v1/messages/text</code>.</p>
                </div>

                <h2 className="mb-4 mt-8 text-xl font-bold">Real World Examples</h2>
                {realWorldExamples.map((ex,i) => (
                  <div key={i} className="mb-4 rounded-2xl border border-border bg-card/40 p-4">
                    <h3 className="font-semibold">{ex.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">{ex.desc}</p>
                    <h5 className="text-[11px] font-semibold uppercase text-muted-foreground">Request</h5>
                    <CodeBlock code={ex.req} />
                    <h5 className="text-[11px] font-semibold uppercase text-muted-foreground">Response</h5>
                    <CodeBlock code={ex.res} />
                  </div>
                ))}
              </>
            )}

            {activeSection === "auth" && <><h1 className="mb-6 text-2xl font-bold">Authentication</h1><p className="mb-6 text-sm text-muted-foreground">All endpoints except <code className="rounded bg-muted px-1.5 py-0.5">/health</code> and <code className="rounded bg-muted px-1.5 py-0.5">/auth/login</code> require a Bearer token. Obtain it by calling <code className="rounded bg-muted px-1.5 py-0.5">POST /auth/login</code>.</p>{endpoints.filter(e=>e.section==='auth').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /></div>)}</>}

            {activeSection === "sessions" && <><h1 className="mb-6 text-2xl font-bold">Sessions API</h1><p className="mb-6 text-sm text-muted-foreground">Manage WhatsApp Web sessions. Create, connect, disconnect, and delete sessions.</p>{endpoints.filter(e=>e.section==='sessions').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /></div>)}</>}

            {activeSection === "messages" && <><h1 className="mb-6 text-2xl font-bold">Messaging API</h1><p className="mb-6 text-sm text-muted-foreground">Send text, images, documents, and other media through connected WhatsApp sessions.</p>{endpoints.filter(e=>e.section==='messages').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /></div>)}</>}

            {activeSection === "system" && <><h1 className="mb-6 text-2xl font-bold">System API</h1><p className="mb-6 text-sm text-muted-foreground">Dashboard stats, logs, message history, API request logs, and rate limits.</p>{endpoints.filter(e=>e.section==='system').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /></div>)}</>}

            {activeSection === "health" && <><h1 className="mb-6 text-2xl font-bold">Health API</h1><p className="mb-6 text-sm text-muted-foreground">Public health check — no auth required. Uptime monitoring and status page integration.</p>{endpoints.filter(e=>e.section==='health').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /><TryItPanel ep={ep} /></div>)}</>}

            {activeSection === "api-keys" && <><h1 className="mb-6 text-2xl font-bold">API Keys</h1><p className="mb-6 text-sm text-muted-foreground">Create and manage <code className="rounded bg-muted px-1.5 py-0.5">cm_</code>-prefixed API keys. Keys can be scoped to a specific WhatsApp session (bot).</p>{endpoints.filter(e=>e.section==='api-keys').map(ep => <div key={ep.method+ep.path} className="mb-4"><EndpointCard ep={ep} /></div>)}</>}

            {activeSection === "websockets" && (
              <>
                <h1 className="mb-6 text-2xl font-bold">WebSockets (Socket.IO)</h1>
                <p className="mb-4 text-sm text-muted-foreground">The frontend receives real-time updates via Socket.IO. External apps can also connect.</p>
                <CodeBlock code={`const socket = io('http://localhost:3000', {\n  transports: ['websocket', 'polling']\n});\n\nsocket.on('session:connected', (data) => {\n  console.log('Session connected:', data);\n});\n\nsocket.on('session:disconnected', (data) => {\n  console.log('Session disconnected:', data);\n});\n\nsocket.on('session:qr', (data) => {\n  console.log('QR code updated:', data.qrCode?.slice(0, 40) + '...');\n});\n\nsocket.on('message:new', (data) => {\n  console.log('New message:', data);\n});`} />
                <h3 className="mb-2 mt-6 font-semibold">Available Events</h3>
                <div className="space-y-2">
                  {["session:created","session:deleted","session:connected","session:disconnected","session:qr","session:pairing_code","message:new"].map(ev => (
                    <div key={ev} className="rounded-xl border border-border bg-card/40 px-4 py-2 text-sm"><code className="text-accent">{ev}</code></div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "sdk" && (
              <>
                <h1 className="mb-6 text-2xl font-bold">SDK Examples</h1>
                <p className="mb-4 text-sm text-muted-foreground">Quick-start code snippets for common languages and platforms.</p>
                <h3 className="mb-2 mt-6 font-semibold">Node.js / TypeScript</h3>
                <CodeBlock code={`import axios from 'axios';\n\nconst api = axios.create({\n  baseURL: 'http://localhost:3000/api/v1',\n  headers: { Authorization: 'Bearer <token>' }\n});\n\n// Send a text message\nconst send = async () => {\n  const { data } = await api.post('/messages/text', {\n    sessionId: '<session-id>',\n    to: '94771234567',\n    content: 'Hello from SDK! 👋'\n  });\n  console.log('Sent:', data.data.messageId);\n};\n\n// List sessions\nconst list = async () => {\n  const { data } = await api.get('/sessions');\n  console.log('Sessions:', data.data);\n};`} />
                <h3 className="mb-2 mt-6 font-semibold">Python</h3>
                <CodeBlock code={`import requests\n\nBASE = 'http://localhost:3000/api/v1'\nTOKEN = '<token>'\nheaders = {'Authorization': f'Bearer {TOKEN}'}\n\ndef send_message(session_id, to, text):\n    r = requests.post(f'{BASE}/messages/text',\n        json={'sessionId': session_id, 'to': to, 'content': text},\n        headers=headers)\n    return r.json()\n\nprint(send_message('<id>', '94771234567', 'Hello from Python! 🐍'))`} />
                <h3 className="mb-2 mt-6 font-semibold">PHP</h3>
                <CodeBlock code={`<?php\n$ch = curl_init('http://localhost:3000/api/v1/messages/text');\ncurl_setopt_array($ch, [\n  CURLOPT_POST => true,\n  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer <token>'],\n  CURLOPT_POSTFIELDS => json_encode([\n    'sessionId' => '<session-id>',\n    'to' => '94771234567',\n    'content' => 'Hello from PHP!'\n  ]),\n  CURLOPT_RETURNTRANSFER => true,\n]);\necho curl_exec($ch);`} />
                <h3 className="mb-2 mt-6 font-semibold">Go</h3>
                <CodeBlock code={`package main\n\nimport (\n  "bytes" "encoding/json" "fmt" "net/http"\n)\n\nfunc main() {\n  body, _ := json.Marshal(map[string]string{\n    "sessionId": "<session-id>",\n    "to": "94771234567",\n    "content": "Hello from Go!",\n  })\n  req, _ := http.NewRequest("POST", "http://localhost:3000/api/v1/messages/text",\n    bytes.NewBuffer(body))\n  req.Header.Set("Content-Type", "application/json")\n  req.Header.Set("Authorization", "Bearer <token>")\n  \n  client := &http.Client{}\n  resp, _ := client.Do(req)\n  fmt.Println(resp)\n}`} />
                <h3 className="mb-2 mt-6 font-semibold">C# (.NET)</h3>
                <CodeBlock code={`using var client = new HttpClient();\nclient.DefaultRequestHeaders.Add("Authorization", "Bearer <token>");\n\nvar payload = new {\n  sessionId = "<session-id>",\n  to = "94771234567",\n  content = "Hello from C#!"\n};\nvar json = JsonSerializer.Serialize(payload);\nvar content = new StringContent(json, Encoding.UTF8, "application/json");\n\nvar response = await client.PostAsync("http://localhost:3000/api/v1/messages/text", content);\nConsole.WriteLine(await response.Content.ReadAsStringAsync());`} />
              </>
            )}

            {activeSection === "faq" && (
              <>
                <h1 className="mb-6 text-2xl font-bold">FAQ</h1>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">What is a session?</h3><p className="mt-1 text-sm text-muted-foreground">A session represents a WhatsApp Web connection. Each session corresponds to one WhatsApp account linked via QR scan or pairing code.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">How do I connect a session?</h3><p className="mt-1 text-sm text-muted-foreground">Create a session via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /sessions</code>, then connect via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /sessions/:id/connect</code> with method <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">"qr"</code> or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">"pairing"</code>. Scan the QR code or enter the pairing code on WhatsApp.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">Can I use an API key instead of a session token?</h3><p className="mt-1 text-sm text-muted-foreground">Yes. Generate an API key from the API Manager page or via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /system/api-keys</code>. Key auth middleware needs to be wired to the routes (currently in development).</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">How many messages can I send?</h3><p className="mt-1 text-sm text-muted-foreground">Rate limits are 500 requests/min, 10,000 messages/day, and 500 media uploads/day (configurable).</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">Do sessions persist across restarts?</h3><p className="mt-1 text-sm text-muted-foreground">Yes. Credentials are encrypted and stored in the database. Sessions automatically reconnect when the server restarts.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">Can I connect multiple WhatsApp accounts?</h3><p className="mt-1 text-sm text-muted-foreground">Yes. Create multiple sessions — each links a different WhatsApp account.</p></div>
                </div>
              </>
            )}

            {activeSection === "trouble" && (
              <>
                <h1 className="mb-6 text-2xl font-bold">Troubleshooting</h1>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">Session stays "connecting" forever</h3><p className="mt-1 text-sm text-muted-foreground">Check that your WhatsApp phone has an active internet connection. Try disconnecting and reconnecting. If the QR code expired, call connect again to generate a new one.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">"No session found to decrypt message"</h3><p className="mt-1 text-sm text-muted-foreground">This happens when a message was sent before the session was fully connected. The message may be lost — this is a Baileys limitation and doesn't affect future messages.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">Connection drops frequently</h3><p className="mt-1 text-sm text-muted-foreground">Check your internet stability. WhatsApp Web sessions can drop on unstable connections. The server will attempt to reconnect automatically.</p></div>
                  <div className="rounded-2xl border border-border bg-card/40 p-4"><h3 className="font-semibold">401 Unauthorized on authenticated routes</h3><p className="mt-1 text-sm text-muted-foreground">Your token may have expired. Call <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">POST /auth/login</code> again to get a fresh token. Check that you're sending the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Authorization: Bearer &lt;token&gt;</code> header.</p></div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

