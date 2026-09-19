(() => {
  "use strict";

  const body = document.body;
  const page = body.dataset.page || "home";
  const root = body.dataset.root || ".";

  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2307111f'/%3E%3Cpath d='M18 18h28v28H18zM10 24h8m-8 8h8m-8 8h8m28-16h8m-8 8h8m-8 8h8M24 10v8m8-8v8m8-8v8M24 46v8m8-8v8m8-8v8' stroke='%234de3ff' stroke-width='4'/%3E%3C/svg%3E";
    document.head.appendChild(icon);
  }

  // The builder discovers lessons from folders; new standalone HTML needs no renderer.
  const categories = window.EMBEDDED_CATALOG?.categories || [];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c =>
    ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

  const pageInfo = {
    voltage: ["电压不是一个点的属性", "电压是两个位置之间的电势差。拖动 VA 与 VB，观察方向和大小。", "electronics"],
    current: ["电流：单位时间通过多少电荷", "调高电压或降低电阻，都会让电流增大。", "electronics"],
    resistor: ["电阻：对电流的阻碍程度", "固定电压后，电阻越大，电流越小。", "electronics"],
    npn: ["NPN 三极管工作区", "用三个端点电压判断截止、放大和饱和状态。", "transistor"],
    pnp: ["PNP 三极管工作区", "PNP 与 NPN 的电势关系相反，但判断方法是对称的。", "transistor"],
    mosfet: ["N 沟道 MOSFET", "栅源电压决定是否形成沟道，漏源电压影响工作区。", "transistor"],
    binary: ["8 位二进制", "每一位只有 0 或 1，但不同位置具有不同位权。", "c-language"],
    modulo: ["求余运算 %", "a % b 得到 a 除以 b 后剩下的部分。", "c-language"],
    bitwise: ["位运算", "计算机把两个整数对齐后，对每一位分别执行规则。", "c-language"],
    gpio: ["P1 端口与 8 个 bit", "一个 8 位端口就是 8 个可独立控制的二进制位。", "8051"],
    timer0: ["Timer0 初值计算", "计数器向上计数到 65535，再溢出产生标志或中断。", "8051"],
    timer2: ["Timer2 重装与溢出", "RCAP2 决定每次溢出前需要计多少次。", "8051"],
    uart: ["UART Mode 1 波特率", "Timer2 提供高速节拍，UART 再分频形成每秒发送的 bit 数。", "8051"]
  };

  // Only catalogued files can be opened; a query parameter is never used as an iframe URL.
  const requestedLesson = page === "reader" ? new URLSearchParams(window.location.search).get("lesson") : null;
  const readerCategory = requestedLesson ? categories.find(c => c.lessons.some(l => l.path === requestedLesson)) : null;
  const readerLesson = readerCategory?.lessons.find(l => l.path === requestedLesson);
  const currentCategory = readerCategory || categories.find(c => c.id === page) || categories.find(c => pageInfo[page]?.[2] === c.id);
  const href = path => `${root}/${path}`.replace(/\/\.\//g, "/");

  function sidebar() {
    return `
      <aside class="sidebar" id="sidebar" aria-label="主要导航">
        <a class="brand" href="${href("index.html")}">
          <span class="brand-mark">EL</span>
          <span><strong>嵌入式学习站</strong><small>Embedded Lab</small></span>
        </a>
        <p class="side-label">学习目录</p>
        <nav class="nav-list">
          <a class="nav-link ${page === "home" ? "active" : ""}" ${page === "home" ? 'aria-current="page"' : ""} href="${href("index.html")}"><span class="nav-icon">⌂</span><span>学习首页</span></a>
          ${categories.map(c => `<a class="nav-link ${currentCategory?.id === c.id ? "active" : ""}" ${currentCategory?.id === c.id ? 'aria-current="page"' : ""} href="${esc(href(c.url))}"><span class="nav-icon">${esc(c.icon)}</span><span>${esc(c.title)}</span></a>`).join("")}
        </nav>
      </aside>`;
  }

  function shell(content, title, parent) {
    const crumb = page === "home" ? "总览" : parent ? `${esc(parent)} / <span>${esc(title)}</span>` : `<span>${esc(title)}</span>`;
    body.innerHTML = `
      <a class="skip-link" href="#main">跳到主要内容</a>
      <div class="site-shell">
        ${sidebar()}
        <div class="overlay" id="overlay"></div>
        <div class="main-wrap">
          <header class="topbar">
            <button class="menu-button" id="menuButton" aria-label="打开网站目录" aria-controls="sidebar" aria-expanded="false">☰</button>
            <div class="crumbs">学习站 / ${crumb}</div>
            <div class="top-status"><span class="status-dot"></span><span>纯静态 · 可离线运行</span></div>
          </header>
          <main class="content" id="main">${content}<footer class="footer">嵌入式学习站 · HTML / CSS / JavaScript · GitHub Pages 兼容</footer></main>
        </div>
      </div>`;
    const menu = document.getElementById("menuButton");
    const side = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const toggle = force => {
      const open = typeof force === "boolean" ? force : !side.classList.contains("open");
      side.classList.toggle("open", open);
      overlay.classList.toggle("show", open);
      menu?.setAttribute("aria-expanded", String(open));
      menu?.setAttribute("aria-label", open ? "关闭网站目录" : "打开网站目录");
    };
    menu?.addEventListener("click", () => toggle());
    overlay?.addEventListener("click", () => toggle(false));
  }

  function homePage() {
    const cards = categories.map(c => `
      <a class="topic-card" href="${esc(href(c.url))}">
        <span class="number">MODULE ${esc(c.no)}</span><span class="arrow">↗</span>
        <h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><span class="tag">${c.lessons.length} 个课程</span>
      </a>`).join("");
    shell(`
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Interactive Embedded Learning</p>
          <h1>把抽象原理，变成可以操作的实验。</h1>
          <p class="lead">从电压、电流到 51 单片机。调参数、看结果、再理解公式，不需要安装任何软件。</p>
          <div class="actions"><a class="button" href="${href("8051/uart.html")}">打开 UART 实验</a><a class="button secondary" href="#modules">查看全部模块</a></div>
        </div>
        <div class="hero-console" aria-label="示例计算">
          <div class="console-bar"><i></i><i></i><i></i></div>
          <div class="console-code"><b>Fosc</b> = 11.0592 MHz<br><b>RCAP2</b> = 0xFFDC<br><br>65536 - 65500 = <em>36</em><br>11,059,200 ÷ (32 × 36)<br><br>Baud = <em>9600</em></div>
          <span class="tag">浏览器实时计算</span>
        </div>
      </section>
      <div class="section-head" id="modules"><div><p class="eyebrow">Learning Map</p><h2>学习模块</h2></div><p>先选一个你正在学习的主题</p></div>
      <section class="category-grid">${cards}</section>`, "学习首页");
  }

  const futureModules = {
    stm32: ["Cortex-M3 与 STM32F103", "GPIO 与时钟树", "中断与 NVIC", "USART / DMA"],
    freertos: ["任务与状态", "抢占式调度", "队列与信号量", "软件定时器"],
    pcb: ["原理图与网络", "封装与元件布局", "布线与设计规则", "Gerber 制造文件"]
  };

  function categoryPage(category) {
    const list = category.lessons;
    const cards = list.length ? list.map((t, i) => `
      <article class="topic-card"><span class="number">LESSON ${String(i + 1).padStart(2, "0")}</span><h3><a href="${esc(href(t.openUrl || t.url))}">${esc(t.title)}</a></h3><p>${esc(t.desc)}</p><div class="actions"><a class="button" href="${esc(href(t.openUrl || t.url))}">打开课程</a><a class="button secondary" href="${esc(href(t.url))}" download>下载 HTML</a></div></article>`).join("")
      : (Object.hasOwn(futureModules, category.id) ? futureModules[category.id] : []).map((name, i) => `<article class="topic-card disabled"><span class="number">ROADMAP ${String(i + 1).padStart(2, "0")}</span><span class="tag">待扩展</span><h3>${esc(name)}</h3><p>已经预留这个章节的位置，后续可以继续添加交互页面。</p></article>`).join("") || `<p class="note">暂无课程。把完整 HTML 放入 ${esc(category.id)}/，下次发布时会自动加入这里。</p>`;
    shell(`
      <header class="page-head"><p class="eyebrow">MODULE ${esc(category.no)}</p><h1>${esc(category.title)}</h1><p>${esc(category.desc)}</p></header>
      <section class="topic-grid">${cards}</section>
      <section class="panel" style="margin-top:20px"><h2>建议学习方式</h2><div class="concept-flow"><div class="concept-step"><strong>1</strong><small>先拖动参数</small></div><div class="concept-step"><strong>2</strong><small>观察结果变化</small></div><div class="concept-step"><strong>3</strong><small>再回看公式</small></div></div></section>`, category.title);
  }

  function readerPage() {
    if (!readerLesson) {
      shell(`<section class="panel"><h1>未找到这节课程</h1><p>课程可能已经移动或删除，请从学习目录重新选择。</p><a class="button" href="${href("index.html")}">返回学习首页</a></section>`, "课程阅读");
      return;
    }
    // Built-in lessons already have the site navigation; do not nest that navigation.
    if (readerLesson.openUrl === readerLesson.url) {
      window.location.replace(href(readerLesson.url));
      return;
    }
    body.classList.add("reader-page");
    document.title = `${readerLesson.title}｜嵌入式学习站`;
    shell(`
      <nav class="reader-toolbar" aria-label="课程操作">
        <div class="reader-links"><a href="${href("index.html")}">⌂ 返回首页</a><a href="${esc(href(readerCategory.url))}">← ${esc(readerCategory.title)}</a></div>
        <div class="reader-actions"><button type="button" id="readerSidebarToggle" aria-controls="sidebar" aria-expanded="true">收起网站目录</button><a href="${esc(href(readerLesson.url))}" target="_blank" rel="noopener" title="在新标签页打开原始课程">单独打开 ↗</a><a class="reader-download" href="${esc(href(readerLesson.url))}" download>下载 HTML</a></div>
      </nav>
      <iframe class="reader-frame" id="lessonFrame" src="${esc(href(readerLesson.url))}" title="${esc(readerLesson.title)}" allow="fullscreen"></iframe>`, readerLesson.title, readerCategory.title);
    document.getElementById("readerSidebarToggle").addEventListener("click", event => {
      const hidden = body.classList.toggle("reader-wide");
      event.currentTarget.textContent = hidden ? "展开网站目录" : "收起网站目录";
      event.currentTarget.setAttribute("aria-expanded", String(!hidden));
    });
  }

  function lessonBase(info, demo, explanation, links) {
    const category = categories.find(c => c.id === info[2]);
    shell(`
      <header class="page-head"><p class="eyebrow">INTERACTIVE LESSON</p><h1>${info[0]}</h1><p>${info[1]}</p><div class="actions"><a class="button secondary" href="${esc(location.href.split('#')[0])}" download>下载本课 HTML</a></div></header>
      <div class="lesson-layout">
        <div>
          <section class="panel" id="experiment"><h2>动手实验</h2>${demo}</section>
          <section class="panel" id="principle"><h2>抓住核心</h2>${explanation}</section>
        </div>
        <aside class="panel side-index"><h3>本页导航</h3><a href="#experiment">动手实验</a><a href="#principle">核心原理</a>${links || ""}<a href="index.html">返回${esc(category.title)}</a></aside>
      </div>`, info[0], category.title);
  }

  function range(id, label, min, max, step, value, unit) {
    return `<div class="control-row"><label for="${id}">${label}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output class="control-value" id="${id}Out">${value} ${unit}</output></div>`;
  }

  function voltageLesson() {
    lessonBase(pageInfo.voltage, `<div class="control-grid">${range("va", "A 点电势 VA", -10, 10, .1, 5, "V")}${range("vb", "B 点电势 VB", -10, 10, .1, 0, "V")}</div><div class="result-box"><span class="result-title">UAB = VA − VB</span><strong class="result-main" id="voltageResult">5.0 V</strong><span class="result-detail" id="voltageDirection">A 点电势更高，正电荷倾向从 A 向 B 运动。</span></div>`, `<p>“A 点有 5V”是简写，完整说法应该是：<strong>A 点相对于参考点 B 高 5V</strong>。</p><div class="formula">UAB = VA - VB</div><p class="note">如果交换测量表笔，UAB 会变成 UBA，数值大小相同、符号相反。</p>`);
    bindRanges(["va", "vb"], () => {
      const a = +$("va").value, b = +$("vb").value, d = a - b;
      $("voltageResult").textContent = `${d.toFixed(1)} V`;
      $("voltageDirection").textContent = d > 0 ? "A 点电势更高，正电荷倾向从 A 向 B 运动。" : d < 0 ? "B 点电势更高，正电荷倾向从 B 向 A 运动。" : "两点电势相同，电压为 0V。";
    });
  }

  function currentLesson() {
    lessonBase(pageInfo.current, `<div class="control-grid">${range("iv", "电压 U", 0, 24, .1, 12, "V")}${range("ir", "电阻 R", 100, 10000, 100, 1000, "Ω")}</div><div class="result-box"><span class="result-title">I = U ÷ R</span><strong class="result-main" id="currentResult">12.00 mA</strong><span class="result-detail">动画越快，表示单位时间通过的电荷越多。</span></div><div class="circuit-stage"><div class="rail top"></div><div class="flow-line active" id="currentFlow"></div><div class="device-node">R</div><div class="rail bottom"></div></div>`, `<p>电流不是“电压被消耗了”，而是电荷的定向移动。电压提供推动作用，电阻限制电流。</p><div class="formula">I = U / R</div><p class="note">1 A = 1000 mA。这里用 mA 显示，更符合常见小电路的数量级。</p>`);
    bindRanges(["iv", "ir"], () => {
      const ma = +$("iv").value / +$("ir").value * 1000;
      $("currentResult").textContent = `${ma.toFixed(2)} mA`;
      $("currentFlow").style.animationDuration = `${Math.max(.12, 1.3 - Math.min(ma, 30) / 28)}s`;
      $("currentFlow").classList.toggle("active", ma > 0);
    });
  }

  function resistorLesson() {
    lessonBase(pageInfo.resistor, `<div class="control-grid">${range("rv", "电源电压", 0, 24, .1, 12, "V")}${range("rr", "电阻", 100, 25000, 100, 1000, "Ω")}</div><div class="result-box"><span class="result-title">电流 I</span><strong class="result-main" id="resistorI">12.00 mA</strong><span class="result-detail" id="resistorP">电阻消耗功率：144.00 mW</span></div>`, `<p>同一个串联支路中，流过每个元件的电流相同。电阻不会“分掉电流”，它通过产生压降限制整个支路的电流。</p><div class="formula">I = U / R　　P = U × I</div><p class="note">选择电阻时除了阻值，还要检查功率是否超过额定值。</p>`);
    bindRanges(["rv", "rr"], () => {
      const v = +$("rv").value, r = +$("rr").value, ma = v / r * 1000, mw = v * v / r * 1000;
      $("resistorI").textContent = `${ma.toFixed(2)} mA`;
      $("resistorP").textContent = `电阻消耗功率：${mw.toFixed(2)} mW`;
    });
  }

  function transistorLesson(kind) {
    const isNpn = kind === "npn";
    const defaults = isNpn ? [0, .7, 5] : [5, 4.3, 0];
    lessonBase(pageInfo[kind], `<div class="control-grid">${range("ve", "发射极 VE", 0, 5, .1, defaults[0], "V")}${range("vb", "基极 VB", 0, 5, .1, defaults[1], "V")}${range("vc", "集电极 VC", 0, 5, .1, defaults[2], "V")}</div><div class="result-box"><span class="result-title">当前判断</span><strong class="result-main" id="qState">放大区</strong><span class="result-detail" id="qDetail"></span><span class="state-badge" id="qBadge">电流通路已建立</span></div><div class="circuit-stage"><div class="rail top"></div><div class="flow-line active" id="qFlow"></div><div class="device-node">${kind.toUpperCase()}</div><div class="rail bottom"></div></div>`, `<p>${isNpn ? "NPN 导通的第一条件是 VB 比 VE 高约 0.7V。要进入放大区，集电极还应高于基极。" : "PNP 导通的第一条件是 VE 比 VB 高约 0.7V。要进入放大区，基极还应高于集电极。"}</p><div class="formula">${isNpn ? "NPN：VB ≈ VE + 0.7V，VC > VB" : "PNP：VE ≈ VB + 0.7V，VB > VC"}</div><p class="note">这是帮助建立直觉的简化硅管模型，真实电路中的 0.7V 会随电流和温度变化。</p>`);
    bindRanges(["ve", "vb", "vc"], () => {
      const e = +$("ve").value, b = +$("vb").value, c = +$("vc").value;
      const junctionOn = isNpn ? b - e >= .55 : e - b >= .55;
      let state, detail, cls;
      if (!junctionOn) { state = "截止区"; detail = isNpn ? "VBE 不足，基极—发射极结未正向导通。" : "VEB 不足，发射极—基极结未正向导通。"; cls = "off"; }
      else if (isNpn ? c > b : b > c) { state = "放大区"; detail = isNpn ? "发射结正偏、集电结反偏。" : "发射结正偏、集电结反偏。"; cls = ""; }
      else { state = "饱和区"; detail = "两个 PN 结都趋向正向导通，不再满足线性放大条件。"; cls = "warn"; }
      $("qState").textContent = state; $("qDetail").textContent = detail;
      $("qBadge").textContent = state === "截止区" ? "主电流通路关闭" : "主电流通路已建立";
      $("qBadge").className = `state-badge ${cls}`; $("qFlow").classList.toggle("active", state !== "截止区");
    });
  }

  function mosfetLesson() {
    lessonBase(pageInfo.mosfet, `<div class="control-grid">${range("vgs", "栅源电压 VGS", 0, 8, .1, 4, "V")}${range("vds", "漏源电压 VDS", 0, 12, .1, 5, "V")}${range("vth", "开启阈值 Vth", 1, 4, .1, 2, "V")}</div><div class="result-box"><span class="result-title">简化工作区判断</span><strong class="result-main" id="mosState">恒流 / 饱和区</strong><span class="result-detail" id="mosDetail"></span></div>`, `<p>先比较 VGS 与阈值 Vth：低于阈值时没有形成足够的导电沟道。导通后，再比较 VDS 与 VGS−Vth。</p><div class="formula">VGS ≤ Vth：截止　|　VDS &lt; VGS−Vth：线性区　|　其余：饱和区</div><p class="note">VGS(th) 只表示“刚开始有微小电流”，并不等于 MOSFET 已经完全导通。</p>`);
    bindRanges(["vgs", "vds", "vth"], () => {
      const gs = +$("vgs").value, ds = +$("vds").value, th = +$("vth").value;
      let state, detail;
      if (gs <= th) { state = "截止区"; detail = "VGS 未超过阈值，沟道尚未充分形成。"; }
      else if (ds < gs - th) { state = "线性 / 欧姆区"; detail = "MOSFET 更像受 VGS 控制的小电阻，适合开关导通状态。"; }
      else { state = "恒流 / 饱和区"; detail = "漏极电流主要受 VGS 控制，常用于放大。"; }
      $("mosState").textContent = state; $("mosDetail").textContent = detail;
    });
  }

  function bitBoxes(value, clickable = false) {
    return Array.from({length: 8}, (_, i) => { const bit = 7 - i, on = (value >> bit) & 1; return `<button class="bit ${on ? "on" : ""}" ${clickable ? `data-bit="${bit}"` : "disabled"}>${on}<small>2^${bit}</small></button>`; }).join("");
  }

  function binaryLesson() {
    lessonBase(pageInfo.binary, `${range("decimal", "十进制数", 0, 255, 1, 63, "")}<div class="bits" id="binaryBits">${bitBoxes(63)}</div><div class="result-box"><span class="result-title">转换结果</span><strong class="result-main" id="binaryResult">0011 1111</strong><span class="result-detail" id="binarySum">32 + 16 + 8 + 4 + 2 + 1 = 63</span></div>`, `<p>从右向左，每一位的位权依次是 1、2、4、8、16、32、64、128。值为 1 的位置参与相加。</p><div class="formula">0011 1111₂ = 32 + 16 + 8 + 4 + 2 + 1 = 63₁₀</div>`);
    bindRanges(["decimal"], () => { const n = +$("decimal").value, s = n.toString(2).padStart(8,"0"); $("binaryBits").innerHTML = bitBoxes(n); $("binaryResult").textContent = `${s.slice(0,4)} ${s.slice(4)}`; const terms = Array.from({length:8},(_,i)=>7-i).filter(b=>(n>>b)&1).map(b=>2**b); $("binarySum").textContent = `${terms.length ? terms.join(" + ") : "0"} = ${n}`; });
  }

  function moduloLesson() {
    lessonBase(pageInfo.modulo, `<div class="control-grid">${range("dividend", "被除数 a", 0, 999, 1, 123, "")}${range("divisor", "除数 b", 1, 50, 1, 10, "")}</div><div class="result-box"><span class="result-title">a % b</span><strong class="result-main" id="modResult">3</strong><span class="result-detail" id="modDetail">123 = 10 × 12 + 3</span></div>`, `<p>求余不是“小数部分”。它问的是：最多装满多少组以后，还剩几个。</p><div class="formula">被除数 = 除数 × 商 + 余数</div><p class="note">取某一位数字时常用“先除掉右侧位数，再 % 10”。</p>`);
    bindRanges(["dividend","divisor"], () => { const a=+$("dividend").value,b=+$("divisor").value,q=Math.floor(a/b),r=a%b; $("modResult").textContent=r; $("modDetail").textContent=`${a} = ${b} × ${q} + ${r}`; });
  }

  function bitwiseLesson() {
    lessonBase(pageInfo.bitwise, `<div class="control-grid">${range("bitA", "数值 A", 0, 255, 1, 60, "")}${range("bitB", "数值 B", 0, 255, 1, 15, "")}<div class="control-row"><label for="operation">运算</label><select id="operation"><option value="and">A & B</option><option value="or">A | B</option><option value="xor">A ^ B</option><option value="left">A &lt;&lt; 1</option><option value="right">A &gt;&gt; 1</option></select><span></span></div></div><div class="result-box"><span class="result-title" id="bitExpression">60 & 15</span><strong class="result-main" id="bitResult">12</strong><span class="result-detail" id="bitBinary">0011 1100 & 0000 1111 = 0000 1100</span></div>`, `<p>& 要求对应位都为 1；| 只要有一个为 1；^ 要求两个位不同。移位相当于整体移动二进制位。</p><div class="formula">& 清零　| 置位　^ 翻转　&lt;&lt; 左移　&gt;&gt; 右移</div>`);
    const update=()=>{const a=+$("bitA").value,b=+$("bitB").value,op=$("operation").value;let r,sym,label;if(op==="and"){r=a&b;sym="&";}else if(op==="or"){r=a|b;sym="|";}else if(op==="xor"){r=a^b;sym="^";}else if(op==="left"){r=(a<<1)&255;sym="<< 1";}else{r=a>>1;sym=">> 1";}label=op==="left"||op==="right"?`${a} ${sym}`:`${a} ${sym} ${b}`;const bin=n=>n.toString(2).padStart(8,"0");$("bitExpression").textContent=label;$("bitResult").textContent=r;$("bitBinary").textContent=op==="left"||op==="right"?`${bin(a)} ${sym} = ${bin(r)}`:`${bin(a)} ${sym} ${bin(b)} = ${bin(r)}`;};
    bindRanges(["bitA","bitB"],update);$("operation").addEventListener("change",update);
  }

  function gpioLesson() {
    lessonBase(pageInfo.gpio, `<p>点击每一位，模拟给 P1 端口整体赋值：</p><div class="bits" id="gpioBits">${bitBoxes(0x1f,true)}</div><div class="result-box"><span class="result-title">C51 赋值</span><strong class="result-main" id="gpioHex">P1 = 0x1F;</strong><span class="result-detail" id="gpioBin">二进制：0001 1111　十进制：31</span></div>`, `<p>P1 是一个 8 位特殊功能寄存器。写入一个数，就是同时决定 P1.7 到 P1.0 八个引脚的电平。</p><div class="formula">0x1F = 0001 1111₂ = 31₁₀</div><p class="note">具体开发板上的 LED 可能是低电平点亮，所以写 0 反而会亮。</p>`);
    let value=0x1f; const render=()=>{$("gpioBits").innerHTML=bitBoxes(value,true);$("gpioHex").textContent=`P1 = 0x${value.toString(16).toUpperCase().padStart(2,"0")};`;const s=value.toString(2).padStart(8,"0");$("gpioBin").textContent=`二进制：${s.slice(0,4)} ${s.slice(4)}　十进制：${value}`;document.querySelectorAll("[data-bit]").forEach(btn=>btn.addEventListener("click",()=>{value^=1<<+btn.dataset.bit;render();}));};render();
  }

  function timer0Lesson() {
    lessonBase(pageInfo.timer0, `<div class="control-grid">${range("t0f", "晶振频率", 1, 24, .0001, 11.0592, "MHz")}${range("t0ms", "目标时间", 1, 50, 1, 10, "ms")}<div class="control-row"><label for="t0mode">机器周期</label><select id="t0mode"><option value="12">12T</option><option value="1">1T</option></select><span></span></div></div><div class="result-box"><span class="result-title">16 位定时器初值</span><strong class="result-main" id="t0Hex">0xDC00</strong><span class="result-detail" id="t0Detail"></span></div>`, `<p>12T 模式下，定时器每 12 个晶振周期加 1。先计算目标时间需要多少次计数，再用 65536 减去计数次数。</p><div class="formula">初值 = 65536 − 时间 × Fosc ÷ T</div><p class="note">若需要的计数次数超过 65535，应缩短单次定时，再用软件累计多次。</p>`);
    const update=()=>{const f=+$("t0f").value*1e6,ms=+$("t0ms").value,t=+$("t0mode").value,counts=Math.round(ms/1000*f/t),valid=counts<=65535,reload=(65536-counts)&0xffff;$("t0Hex").textContent=valid?`0x${reload.toString(16).toUpperCase().padStart(4,"0")}`:"超过 16 位范围";$("t0Detail").textContent=valid?`计数 ${counts} 次；TH0 = 0x${(reload>>8).toString(16).toUpperCase().padStart(2,"0")}，TL0 = 0x${(reload&255).toString(16).toUpperCase().padStart(2,"0")}`:`需要 ${counts} 次计数，请缩短目标时间。`;};bindRanges(["t0f","t0ms"],update);$("t0mode").addEventListener("change",update);
  }

  function timer2Lesson() {
    lessonBase(pageInfo.timer2, `<div class="control-grid">${range("t2f", "晶振频率", 1, 24, .0001, 11.0592, "MHz")}${range("t2reload", "重装值 RCAP2", 64000, 65535, 1, 65500, "")}</div><div class="result-box"><span class="result-title">每次溢出前计数</span><strong class="result-main" id="t2Counts">36 次</strong><span class="result-detail" id="t2Detail">波特率发生器模式溢出率：153,600 Hz</span></div>`, `<p>Timer2 从重装值向上数，数到 65535 后再加 1 就溢出。因此计数次数不是 65535−初值，而是 65536−初值。</p><div class="formula">计数次数 = 65536 − RCAP2</div><p class="note">作为 8052 UART 波特率发生器时，Timer2 的计数节拍为 Fosc÷2，所以溢出率 = Fosc÷[2×计数次数]。</p>`);
    bindRanges(["t2f","t2reload"],()=>{const f=+$("t2f").value*1e6,r=+$("t2reload").value,c=65536-r,hz=f/(2*c);$("t2Counts").textContent=`${c} 次`;$("t2Detail").textContent=`0x${r.toString(16).toUpperCase()}；波特率发生器模式溢出率：${Math.round(hz).toLocaleString()} Hz`;});
  }

  function uartLesson() {
    lessonBase(pageInfo.uart, `<div class="control-grid">${range("uf", "晶振频率", 1, 24, .0001, 11.0592, "MHz")}${range("ureload", "RCAP2", 64000, 65535, 1, 65500, "")}</div><div class="metrics"><div class="metric"><span>计数次数</span><strong id="uCounts">36</strong></div><div class="metric"><span>Timer2 溢出率</span><strong id="uOverflow">153600 Hz</strong></div><div class="metric"><span>UART 内部分频</span><strong id="uDivide">÷16</strong></div></div><div class="result-box"><span class="result-title">最终波特率</span><strong class="result-main" id="uBaud">9600 baud</strong><span class="result-detail" id="uError">标准值：9600，误差 0.00%</span></div>`, `<p>关键是分清两个频率：Timer2 在波特率发生器模式下先按 Fosc÷2 计数，因此 36 次计数产生 153600Hz 的溢出率；UART 再将溢出率除以 16，得到 9600 baud。</p><div class="formula">Overflow = Fosc ÷ [2 × (65536 − RCAP2)]<br>Baud = Overflow ÷ 16 = Fosc ÷ [32 × (65536 − RCAP2)]</div><p class="note">使用 Timer2 产生 Mode 1 / Mode 3 波特率时，传统 8052 的 SMOD 位不参与这条公式；SMOD 主要影响 Timer1 波特率方案。</p>`);
    const update=()=>{const f=+$("uf").value*1e6,r=+$("ureload").value,c=65536-r,overflow=f/(2*c),baud=overflow/16,standards=[1200,2400,4800,9600,19200,38400,57600,115200],near=standards.reduce((a,b)=>Math.abs(b-baud)<Math.abs(a-baud)?b:a),err=Math.abs(baud-near)/near*100;$("uCounts").textContent=c;$("uOverflow").textContent=`${Math.round(overflow)} Hz`;$("uDivide").textContent="÷16";$("uBaud").textContent=`${baud.toFixed(2)} baud`;$("uError").textContent=`最近标准值：${near}，误差 ${err.toFixed(2)}%`;};bindRanges(["uf","ureload"],update);
  }

  function $(id) { return document.getElementById(id); }
  function bindRanges(ids, update) { ids.forEach(id => { const el=$(id),out=$(`${id}Out`); const sync=()=>{if(out) out.textContent=`${el.value}${out.textContent.includes("MHz")?" MHz":out.textContent.includes("ms")?" ms":out.textContent.includes("Ω")?" Ω":out.textContent.includes("V")?" V":""}`;update();};el.addEventListener("input",sync); }); update(); }

  const renderers = { voltage: voltageLesson, current: currentLesson, resistor: resistorLesson, npn: () => transistorLesson("npn"), pnp: () => transistorLesson("pnp"), mosfet: mosfetLesson, binary: binaryLesson, modulo: moduloLesson, bitwise: bitwiseLesson, gpio: gpioLesson, timer0: timer0Lesson, timer2: timer2Lesson, uart: uartLesson };

  if (!categories.length) {
    body.textContent = "目录尚未生成，请运行 node scripts/build-catalog.js，再打开 _site/index.html。线上请检查 GitHub Actions 是否构建成功。";
  }
  else if (page === "home") homePage();
  else if (page === "reader") readerPage();
  else if (categories.some(c => c.id === page)) categoryPage(categories.find(c => c.id === page));
  else if (renderers[page]) renderers[page]();
})();
