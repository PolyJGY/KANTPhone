/* KANT OS shell
   - Lock screen -> Home screen -> App screen state machine
   - Polls /api/status on the KANT OS server (server/server.py) for the
     Raspberry Pi pairing card: SSH / Docker / uptime.
   - Falls back to a local simulation when no server is present
     (e.g. opening index.html directly from disk).
*/

const STATE = {
  config: {
    device: "kant-phone-01",
    host: window.location.hostname || "raspberrypi.local",
    port: window.location.port || "8420",
    platform: "raspberry-pi",
    mode: "mobile-os",
    ui_theme: "KANT Dark",
    inspiration: "Volla Phone Plinius",
    target_hardware: "Raspberry Pi",
    runtime: "ubuntu-linux",
    activation: "remote-ssh + systemd",
    boot_mode: "kiosk",
  },
  status: null,     // last /api/status payload
  polling: null,
};

/* ---------------- clock ---------------- */
function fmtTime(d){
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDate(d){
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
}
function tickClock(){
  const now = new Date();
  const t = fmtTime(now), dstr = fmtDate(now);
  ['statusClock'].forEach(id => document.getElementById(id).textContent = t.slice(0,5));
  document.getElementById('lockTime').textContent = t;
  document.getElementById('lockDate').textContent = dstr;
  document.getElementById('homeTime').textContent = t;
  document.getElementById('homeDate').textContent = dstr;
}
setInterval(tickClock, 1000); tickClock();

/* ---------------- pairing status ---------------- */
function renderStatus(payload){
  const dots = ['linkDot','cardDot'];
  const state = payload.ssh_connected && payload.docker_running ? 'on'
              : (payload.ssh_connected || payload.docker_running) ? 'connecting'
              : 'off';
  dots.forEach(id => {
    const el = document.getElementById(id);
    el.className = 'dot dot--' + state;
  });
  document.getElementById('linkLabel').textContent =
    state === 'on' ? '연결됨' : state === 'connecting' ? '연결 중' : '연결 대기';

  document.getElementById('lockDevice').textContent = payload.device;
  document.getElementById('lockHost').textContent = payload.host;
  document.getElementById('lockPort').textContent = payload.port;
  document.getElementById('cardHost').textContent = payload.host;
  document.getElementById('cardPort').textContent = payload.port;
  document.getElementById('cardStatus').textContent =
    `SSH ${payload.ssh_connected ? '연결됨' : '대기'} · Docker ${payload.docker_running ? '실행 중' : '미확인'}`;
  document.getElementById('cardUptime').textContent =
    payload.uptime_seconds != null ? `uptime ${Math.floor(payload.uptime_seconds)}s` : 'uptime —';
}

async function pollStatus(){
  try{
    const res = await fetch('/api/status', { cache: 'no-store' });
    if(!res.ok) throw new Error('no status endpoint');
    const data = await res.json();
    STATE.status = data;
    renderStatus(data);
  }catch(e){
    // No KANT OS server reachable (static preview) -> simulate a believable pairing state
    renderStatus({
      device: STATE.config.device,
      host: STATE.config.host,
      port: STATE.config.port,
      ssh_connected: false,
      docker_running: false,
      uptime_seconds: null,
    });
  }
}
pollStatus();
STATE.polling = setInterval(pollStatus, 4000);

/* ---------------- lock / home transitions ---------------- */
const lockScreen = document.getElementById('lockScreen');
const homeScreen = document.getElementById('homeScreen');
const appScreen  = document.getElementById('appScreen');

document.getElementById('unlockBtn').addEventListener('click', () => {
  lockScreen.hidden = true;
  homeScreen.hidden = false;
});

/* ---------------- app registry ---------------- */
const APPS = [
  { id:'pairing', label:'페어링', glyph:'⌁', dock:true,  render: renderPairingApp },
  { id:'settings', label:'설정',  glyph:'⚙', dock:true,  render: renderSettingsApp },
  { id:'docs',    label:'배포 문서', glyph:'⌘', dock:true,  render: renderDocsApp },
  { id:'about',   label:'KANT 소개', glyph:'◈', dock:true,  render: renderAboutApp },
  { id:'notes',   label:'메모', glyph:'✎', dock:false, render: comingSoon('메모') },
  { id:'clock',   label:'시계', glyph:'◷', dock:false, render: comingSoon('시계') },
  { id:'camera',  label:'카메라', glyph:'◎', dock:false, render: comingSoon('카메라') },
  { id:'browser', label:'브라우저', glyph:'⟡', dock:false, render: comingSoon('브라우저') },
];

function comingSoon(name){
  return () => `<div class="note">${name} 앱은 아직 준비 중입니다. KANT Phone 로드맵의 다음 단계에서 구현됩니다.</div>`;
}

const grid = document.getElementById('appGrid');
const dock = document.getElementById('dock');
APPS.forEach(app => {
  const btn = document.createElement('button');
  btn.className = 'app-icon';
  btn.innerHTML = `<span class="app-icon__glyph">${app.glyph}</span><span class="app-icon__label">${app.label}</span>`;
  btn.addEventListener('click', () => openApp(app.id));
  grid.appendChild(btn);
  if(app.dock){
    const dbtn = btn.cloneNode(true);
    dbtn.querySelector('.app-icon__label').remove();
    dbtn.addEventListener('click', () => openApp(app.id));
    dock.appendChild(dbtn);
  }
});

function openApp(id){
  const app = APPS.find(a => a.id === id);
  if(!app) return;
  document.getElementById('appTitle').textContent = app.label;
  document.getElementById('appBody').innerHTML = app.render();
  wireAppInteractions(id);
  homeScreen.hidden = true;
  appScreen.hidden = false;
}
document.getElementById('appBack').addEventListener('click', () => {
  appScreen.hidden = true;
  homeScreen.hidden = false;
});

/* ---------------- Settings app ---------------- */
function renderSettingsApp(){
  const c = STATE.config;
  return `
    <div class="section-title">RASPBERRY PI 연결</div>
    <div class="field"><label>기기 이름</label><input id="cfgDevice" value="${c.device}"></div>
    <div class="field"><label>HOST / IP</label><input id="cfgHost" value="${c.host}"></div>
    <div class="field"><label>PORT</label><input id="cfgPort" value="${c.port}"></div>
    <button class="btn" id="saveCfg">연결 정보 저장</button>
    <div class="note" style="margin-top:14px;">
      이 값은 KANT OS 서버(<code>server/server.py</code>)가 라즈베리파이에서 열고 있는
      IP : PORT 와 일치해야 합니다. VSCode Remote-SSH 로 접속한 뒤 서버를 실행하고,
      이 앱에서 같은 주소를 입력하면 상단 상태바에 연결 상태가 표시됩니다.
    </div>
    <div class="section-title">모바일 OS 환경</div>
    <div class="kv"><span>플랫폼</span><b>${c.platform}</b></div>
    <div class="kv"><span>모드</span><b>${c.mode}</b></div>
    <div class="kv"><span>런타임</span><b>${c.runtime}</b></div>
    <div class="kv"><span>테마</span><b>${c.ui_theme}</b></div>
    <div class="kv"><span>영감</span><b>${c.inspiration}</b></div>
    <div class="kv"><span>대상 하드웨어</span><b>${c.target_hardware}</b></div>
  `;
}
function wireSettings(){
  const btn = document.getElementById('saveCfg');
  if(!btn) return;
  btn.addEventListener('click', () => {
    STATE.config.device = document.getElementById('cfgDevice').value || STATE.config.device;
    STATE.config.host   = document.getElementById('cfgHost').value || STATE.config.host;
    STATE.config.port   = document.getElementById('cfgPort').value || STATE.config.port;
    pollStatus();
    btn.textContent = '저장됨 ✓';
    setTimeout(() => btn.textContent = '연결 정보 저장', 1200);
  });
}

/* ---------------- Pairing / terminal app ---------------- */
function renderPairingApp(){
  const s = STATE.status || {};
  return `
    <div class="section-title">연결 상태</div>
    <div class="kv"><span>기기</span><b>${STATE.config.device}</b></div>
    <div class="kv"><span>주소</span><code>${STATE.config.host}:${STATE.config.port}</code></div>
    <div class="kv"><span>SSH</span>${badge(s.ssh_connected, 'CONNECTED', 'WAITING')}</div>
    <div class="kv"><span>Docker</span>${badge(s.docker_running, 'RUNNING', 'STOPPED')}</div>
    <div class="section-title">부팅 로그</div>
    <div class="terminal" id="bootLog">${bootLogLines().join('\n')}</div>
    <button class="btn btn--ghost" id="refreshLog" style="margin-top:12px;">로그 새로고침</button>
  `;
}
function badge(ok, onLabel, offLabel){
  return `<span class="badge ${ok ? 'badge--on' : ''}">${ok ? onLabel : offLabel}</span>`;
}
function bootLogLines(){
  const c = STATE.config;
  const s = STATE.status || {};
  return [
    `$ ssh pi@${c.host}`,
    `<span class="muted"># VSCode Remote-SSH 확장으로 접속</span>`,
    `pi@${c.host}:~$ cd KANTPhone && ls`,
    `README.md  os/  server/  deploy/`,
    `pi@${c.host}:~$ python3 server/server.py --host 0.0.0.0 --port ${c.port}`,
    `<span class="${s.ssh_connected ? '' : 'warn'}">[kant-os] serving on ${c.host}:${c.port} ${s.ssh_connected ? '(reachable)' : '(대기 중 — 아직 응답 없음)'}</span>`,
    `<span class="muted"># Docker 로 실행하려면:</span>`,
    `pi@${c.host}:~$ docker compose -f deploy/docker-compose.yml up -d`,
    `<span class="${s.docker_running ? '' : 'warn'}">[docker] kant-os-container ${s.docker_running ? 'Up' : 'not running'}</span>`,
  ];
}
function wirePairing(){
  const btn = document.getElementById('refreshLog');
  if(!btn) return;
  btn.addEventListener('click', async () => { await pollStatus(); openApp('pairing'); });
}

/* ---------------- Docs app ---------------- */
function renderDocsApp(){
  return `
    <div class="section-title">배포 순서</div>
    <div class="note"><b style="color:var(--text-1)">1. VSCode Remote-SSH</b><br>Raspberry Pi(Ubuntu) 에 SSH 로 접속해 저장소를 클론합니다. 자세한 명령은 <code>deploy/SETUP.md</code> 참고.</div>
    <div class="note"><b style="color:var(--text-1)">2. 서버 실행</b><br><code>python3 server/server.py --host 0.0.0.0 --port 8420</code> — 표준 라이브러리만 사용해 별도 설치가 필요 없습니다.</div>
    <div class="note"><b style="color:var(--text-1)">3. Docker(선택)</b><br><code>docker compose up -d</code> 로 컨테이너에서 동일한 서버를 실행할 수 있습니다.</div>
    <div class="note"><b style="color:var(--text-1)">4. 키오스크로 부팅</b><br><code>deploy/kant-os.service</code> 를 systemd 에 등록하면 라즈베리파이 부팅 시 Chromium 이 자동으로 이 화면을 전체화면으로 엽니다.</div>
    <div class="section-title">참고</div>
    <div class="kv"><span>개발 환경</span><b>VSCode</b></div>
    <div class="kv"><span>대상 언어/기술</span><b>Ubuntu Linux</b></div>
    <div class="kv"><span>영감이 된 OS</span><b>Volla Plinius</b></div>
  `;
}

/* ---------------- About app ---------------- */
function renderAboutApp(){
  return `
    <div class="section-title">KANT PHONE</div>
    <div class="note">
      KANT Phone 은 폰 하드웨어가 아니라 <b style="color:var(--text-1)">Mobile OS Environment</b> 를
      먼저 만드는 프로젝트입니다. Raspberry Pi 위에서 동작할 것을 목표로 하며,
      개발은 VSCode 에서, 실행 환경은 Ubuntu Linux 위에서 이루어집니다.
    </div>
    <div class="kv"><span>작성인</span><b>정구영</b></div>
    <div class="kv"><span>작성일</span><b>2026-08-08</b></div>
    <div class="kv"><span>플랫폼</span><b>Raspberry Pi</b></div>
    <div class="kv"><span>모드</span><b>mobile-os</b></div>
    <div class="kv"><span>런타임</span><b>ubuntu-linux</b></div>
    <div class="kv"><span>시작 방식</span><b>Remote-SSH + systemd + kiosk</b></div>
    <div class="kv"><span>디자인 영감</span><b>kant.spartaclub.kr</b></div>
    <div class="kv"><span>OS 영감</span><b>Volla Phone Plinius</b></div>
    <div class="section-title">KANT MANIFESTO (발췌)</div>
    <div class="note">"AI시대, 인간의 가능성을 새로 정의합니다." — Korea AI Native Technologists</div>
  `;
}

function wireAppInteractions(id){
  if(id === 'settings') wireSettings();
  if(id === 'pairing') wirePairing();
}
