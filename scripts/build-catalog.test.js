"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const {metadata, scanCatalog, buildSite, catalogSource} = require("./build-catalog.js");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "embedded-catalog-test-"));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const put = (relative, text) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, text);
  };
  put("assets/style.css", "body {color: #eaf6ff;}");
  put("assets/site.js", fs.readFileSync(path.resolve(__dirname, "../assets/site.js"), "utf8"));
  put("index.html", '<!doctype html><html><head><title>首页</title><link rel="stylesheet" href="assets/style.css"><script defer src="assets/site.js"></script></head><body data-page="home" data-root="."></body></html>');
  put("8051/category.json", JSON.stringify({title: "51 单片机", order: 4}));
  return {root, put};
}

test("metadata: order-independent attributes, entities, optional fields and no script execution", () => {
  const m = metadata(`<head><!-- <title>wrong</title> --><script>throw new Error('never execute'); const s='<meta name="lesson-title" content="wrong">';</script><title>定时器 &amp; GPIO｜嵌入式学习站</title><META content='中断 &quot;演示&quot;' name='lesson-title'><meta content=20 name=lesson-order></head><body></body>`);
  assert.equal(m.title, "定时器 & GPIO");
  assert.equal(m.meta["lesson-title"], '中断 "演示"');
  assert.equal(m.meta["lesson-order"], "20");
});

test("drop-in HTML: discover optional metadata, nested lessons, URL encoding and new categories", t => {
  const {root, put} = fixture(t);
  put("8051/first.html", '<head><meta name="lesson-order" content="10"><title>第一课</title></head>');
  put("8051/中断 #1.html", '<head><meta name="lesson-title" content="中断系统"><meta name="lesson-order" content="20"><meta name="lesson-description" content="测试说明"></head>');
  put("8051/unnamed.html", "<h1>没有 title</h1>");
  put("8051/nested/index.html", "<title>嵌套课程</title>");
  put("8051/private.html", '<meta name="lesson-hidden" content="true"><title>不列出</title>');
  put("8051/_draft.html", "<title>草稿</title>");
  put("_site/ignored.html", "<title>不得扫描产物</title>");
  put("scripts/ignored.html", "<title>不得扫描脚本</title>");
  put("rt-thread/start.html", "<title>RT-Thread 入门</title>");
  const c = scanCatalog(root);
  assert.deepEqual(c.categories.map(x => x.id), ["8051", "rt-thread"]);
  const lessons = c.categories[0].lessons;
  assert.equal(lessons.length, 4);
  assert.equal(lessons[0].title, "第一课");
  assert.equal(lessons[1].desc, "测试说明");
  assert.equal(lessons[1].url, "8051/%E4%B8%AD%E6%96%AD%20%231.html");
  assert.equal(lessons.find(l => l.path.endsWith("unnamed.html")).title, "unnamed");
  assert.ok(lessons.some(l => l.path.endsWith("nested/index.html")));
});

test("build: standalone pages, untouched custom HTML, deterministic rebuild and removal", t => {
  const {root, put} = fixture(t);
  const independent = '<!doctype html><html><head><title>独立课程</title><style>button{color:red}</style></head><body><button id="b">演示</button><script>document.getElementById("b").onclick=()=>alert("ok");</script></body></html>';
  put("8051/custom.html", independent);
  put("8051/gpio.html", '<html><head><title>GPIO</title><link rel="stylesheet" href="../assets/style.css"><script defer src="../assets/site.js"></script></head><body data-page="gpio" data-root=".."></body></html>');
  put("scripts/not-public.js", "throw new Error('private build script')");
  const first = buildSite(root, true);
  const home = fs.readFileSync(path.join(first.output, "index.html"), "utf8");
  const lesson = fs.readFileSync(path.join(first.output, "8051/gpio.html"), "utf8");
  assert.ok(home.includes("window.EMBEDDED_CATALOG"));
  assert.ok(home.includes("DOMContentLoaded"));
  assert.ok(home.includes("<style>"));
  assert.ok(!/<script\b[^>]*\bsrc=/i.test(lesson));
  assert.ok(!/<link\b[^>]*\brel="stylesheet"/i.test(lesson));
  assert.equal(fs.readFileSync(path.join(first.output, "8051/custom.html"), "utf8"), independent);
  assert.ok(fs.existsSync(path.join(root, "8051/index.html")));
  assert.ok(!fs.existsSync(path.join(first.output, "scripts")));
  assert.ok(!fs.existsSync(path.join(first.output, "8051/category.json")));
  buildSite(root, true);
  assert.equal(fs.readFileSync(path.join(root, "index.html"), "utf8"), home);
  fs.unlinkSync(path.join(root, "8051/custom.html"));
  const next = buildSite(root);
  assert.equal(next.catalog.categories[0].lessons.length, 1);
  assert.ok(!fs.existsSync(path.join(next.output, "8051/custom.html")));
});

test("rendered categories: links and downloads are relative, text cannot inject markup", t => {
  const {root, put} = fixture(t);
  put("8051/new.html", '<title>&lt;img src=x onerror=alert(1)&gt;</title>');
  const {output} = buildSite(root);
  const html = fs.readFileSync(path.join(output, "8051/index.html"), "utf8");
  let onReady;
  const body = {dataset: {page: "8051", root: ".."}, innerHTML: ""};
  const button = {addEventListener() {}, setAttribute() {}, classList: {toggle() {}, contains() {return false;}}};
  const document = {
    body,
    querySelector() {return true;},
    getElementById() {return button;},
    addEventListener(event, callback) {if(event === "DOMContentLoaded") onReady = callback;}
  };
  const context = vm.createContext({document, window: {}});
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(script[1], context);
  onReady();
  assert.ok(body.innerHTML.includes('href="../8051/new.html" download'));
  assert.ok(body.innerHTML.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(!body.innerHTML.includes("<img src=x"));
  assert.ok(!body.innerHTML.includes('href="/8051/'));
});

test("catalog escapes closing script sequences and output overwrite is guarded", t => {
  const text = catalogSource({categories: [{title: '</script><script>alert(1)</script>'}]});
  assert.ok(!text.includes("</script>"));
  const {root, put} = fixture(t);
  put("_site/user-file.txt", "Keep my file");
  assert.throws(() => buildSite(root), /防止覆盖/);
  assert.equal(fs.readFileSync(path.join(root, "_site/user-file.txt"), "utf8"), "Keep my file");
});
