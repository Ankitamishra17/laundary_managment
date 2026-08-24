/* eslint-disable no-console */
// Temporary browser-flow probe — drives headless Chrome over CDP.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const profile = mkdtempSync(join(tmpdir(), "wf-chrome-"));
const port = 9225;

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function findPage() {
  for (let i = 0; i < 40; i++) {
    try {
      const targets = await getJson(`http://localhost:${port}/json/list`);
      const page = targets.find((t) => t.type === "page");
      if (page) return page;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome CDP target not found");
}

async function main() {
  const page = await findPage();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  const logs = [];

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === "Page.javascriptDialogOpening") {
      send("Page.handleJavaScriptDialog", { accept: true });
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      logs.push(`[console.${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      logs.push(`[EXCEPTION] ${msg.params.exceptionDetails?.text} ${msg.params.exceptionDetails?.exception?.description ?? ""}`);
    }
    if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
      logs.push(`[HTTP ${msg.params.response.status}] ${msg.params.response.url}`);
    }
  };

  await new Promise((r) => ws.addEventListener("open", r));
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Page.enable");

  const navigate = async (url) => {
    await send("Page.navigate", { url });
    await sleep(3500);
  };
  const evalJs = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.value;
  };

  try {
    const DEV = process.env.DEV_URL || "http://localhost:5174";

    // 0. Create a fresh shop via super admin (gets temp admin password)
    const saTok = (await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "superadmin@gmail.com", password: "SuperAdmin123@" }),
    }).then((r) => r.json())).token;
    const shopEmail = "probe" + Date.now() + "@example.com";
    const created = await fetch("http://localhost:5000/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${saTok}` },
      body: JSON.stringify({ name: "Probe Laundry", ownerName: "Probe Admin", email: shopEmail, phone: "7777" + String(Date.now()).slice(-6), address: "Test Rd", city: "Delhi", state: "DL", country: "India", subscriptionPlan: "Monthly", subscriptionAmount: 5000, planName: "Pro" }),
    }).then((r) => r.json());
    console.log("CREATE SHOP:", created.success, created.message, created.admin?.temporaryPassword ? "temp-pw-ok" : "NO TEMP PW");
    const tempPw = created.admin?.temporaryPassword;

    // 0b. Browser: login as that new admin → should redirect to /create-password
    await navigate(DEV + "/login");
    await sleep(2500);
    await evalJs(`(() => { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; const e = document.querySelector('input[type=email]'); setter.call(e, ${JSON.stringify(shopEmail)}); e.dispatchEvent(new Event('input', {bubbles:true})); const p = document.querySelector('input[type=password]'); setter.call(p, ${JSON.stringify(tempPw || "")}); p.dispatchEvent(new Event('input', {bubbles:true})); document.querySelector('form').requestSubmit(); return 'ok'; })()`);
    await sleep(4500);
    const createPwPath = await evalJs("location.pathname");
    console.log("NEW ADMIN after login path (expect /create-password):", createPwPath);
    // Complete the create-password form
    const cpResult = await evalJs(`(() => { const inputs = [...document.querySelectorAll('input[type=password]')]; if (inputs.length < 3) return 'ONLY ' + inputs.length + ' inputs'; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(inputs[0], ${JSON.stringify(tempPw || "")}); inputs[0].dispatchEvent(new Event('input', {bubbles:true})); setter.call(inputs[1], 'ProbePass@123'); inputs[1].dispatchEvent(new Event('input', {bubbles:true})); setter.call(inputs[2], 'ProbePass@123'); inputs[2].dispatchEvent(new Event('input', {bubbles:true})); document.querySelector('form').requestSubmit(); return 'submitted'; })()`);
    console.log("CREATE-PASSWORD submit:", cpResult);
    await sleep(4000);
    console.log("NEW ADMIN final path:", await evalJs("location.pathname"));

    // 1. Admin login
    await navigate(DEV + "/login");
    const inputInfo = await evalJs(`JSON.stringify([...document.querySelectorAll('input')].map(i => ({type: i.type, name: i.name, id: i.id})))`);
    console.log("LOGIN INPUTS:", inputInfo);
    const setEmail = await evalJs(`(() => { const i = document.querySelector('input[type=email]') || document.querySelectorAll('input')[0]; if (!i) return 'NO EMAIL INPUT'; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(i, 'amisha@gmail.com'); i.dispatchEvent(new Event('input', {bubbles: true})); return 'set:'+i.value; })()`);
    console.log("SET EMAIL:", setEmail);
    const setPass = await evalJs(`(() => { const i = document.querySelector('input[type=password]'); if (!i) return 'NO PASS INPUT'; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(i, 'Admin@12345'); i.dispatchEvent(new Event('input', {bubbles: true})); return 'set:'+i.value; })()`);
    console.log("SET PASS:", setPass);
    const submitted = await evalJs(`(() => { const f = document.querySelector('form'); if (!f) return 'NO FORM'; f.requestSubmit(); return 'submitted'; })()`);
    console.log("SUBMIT:", submitted);
    await sleep(5000);
    const url1 = await evalJs("location.pathname");
    const stored = await evalJs(`JSON.stringify({token: (localStorage.getItem('token')||'').slice(0,15), user: localStorage.getItem('user')})`);
    console.log("ADMIN after login path:", url1, "STORED:", stored.slice(0, 200));

    // 2. Admin orders page
    await navigate(DEV + "/admin/orders");
    await sleep(4000);
    const ordersHtml = await evalJs(`document.body.innerText.slice(0, 600)`);
    console.log("ADMIN ORDERS PAGE TEXT:", ordersHtml.replace(/\n+/g, " | ").slice(0, 500));

    // 2b. Admin customers + tasks + employees pages
    await navigate(DEV + "/admin/customers");
    await sleep(3500);
    console.log("ADMIN CUSTOMERS TEXT:", (await evalJs(`document.body.innerText.slice(0, 300)`)).replace(/\n+/g, " | ").slice(0, 250));
    await navigate(DEV + "/admin/tasks");
    await sleep(3500);
    console.log("ADMIN TASKS TEXT:", (await evalJs(`document.body.innerText.slice(0, 300)`)).replace(/\n+/g, " | ").slice(0, 250));
    await navigate(DEV + "/admin/employees");
    await sleep(3500);
    console.log("ADMIN EMPLOYEES TEXT:", (await evalJs(`document.body.innerText.slice(0, 300)`)).replace(/\n+/g, " | ").slice(0, 250));

    // 3. Customer — seed token directly (login form verified separately)
    const customerLogin = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "flowtester@example.com", password: "Test@12345" }),
    }).then((r) => r.json());
    console.log("CUSTOMER API login success:", customerLogin.success, customerLogin.message);
    await evalJs(`localStorage.setItem('token', ${JSON.stringify(customerLogin.token || "")})`);
    await evalJs(`localStorage.setItem('user', ${JSON.stringify(JSON.stringify(customerLogin.user || {}))})`);

    // 4. Customer login FORM test (mustChangePassword=false for customers)
    await navigate("http://localhost:5174/login");
    await sleep(2500);
    await evalJs(`(() => { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; const e = document.querySelector('input[type=email]'); setter.call(e, 'flowtester@example.com'); e.dispatchEvent(new Event('input', {bubbles:true})); const p = document.querySelector('input[type=password]'); setter.call(p, 'Test@12345'); p.dispatchEvent(new Event('input', {bubbles:true})); document.querySelector('form').requestSubmit(); return 'ok'; })()`);
    await sleep(4500);
    const urlC = await evalJs("location.pathname");
    console.log("CUSTOMER FORM login path:", urlC);

    // 4.5 Divakar admin (mustChangePassword=1) — first-login password flow
    const dLogin = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "divakar@gmail.com", password: "Admin@12345" }),
    }).then((r) => r.json());
    console.log("DIVAKAR login success:", dLogin.success, "mustChange:", dLogin.mustChangePassword);
    await evalJs(`localStorage.setItem('token', ${JSON.stringify(dLogin.token || "")})`);
    await evalJs(`localStorage.setItem('user', ${JSON.stringify(JSON.stringify(dLogin.user || {}))})`);
    await navigate("http://localhost:5174/login");
    await sleep(1500);
    await evalJs(`location.href='${DEV}/admin/dashboard'`);
    await sleep(3500);
    const divPath = await evalJs("location.pathname");
    console.log("DIVAKAR dashboard path:", divPath);
    const divText = await evalJs(`document.body.innerText.slice(0, 200)`);
    console.log("DIVAKAR page text:", divText.replace(/\n+/g, " | ").slice(0, 150));

    // 5. Super admin dashboard
    const saLogin = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "superadmin@gmail.com", password: "SuperAdmin123@" }),
    }).then((r) => r.json());
    await evalJs(`localStorage.setItem('token', ${JSON.stringify(saLogin.token || "")})`);
    await evalJs(`localStorage.setItem('user', ${JSON.stringify(JSON.stringify(saLogin.user || {}))})`);
    await navigate(DEV + "/super/dashboard");
    await sleep(4000);
    const superText = await evalJs(`document.body.innerText.slice(0, 500)`);
    console.log("SUPER DASHBOARD TEXT:", superText.replace(/\n+/g, " | ").slice(0, 400));

    // 4. Customer track order
    await navigate(DEV + "/customer/orders/8");
    await sleep(4000);
    const trackHtml = await evalJs(`document.body.innerText.slice(0, 700)`);
    console.log("CUSTOMER TRACK PAGE TEXT:", trackHtml.replace(/\n+/g, " | ").slice(0, 600));
  } catch (err) {
    console.log("PROBE ERROR:", err.message);
  }

  console.log("---- BROWSER LOGS ----");
  logs.slice(0, 30).forEach((l) => console.log(l));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
