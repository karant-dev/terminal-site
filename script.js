/* ============================================================
   Terminal Portfolio — script.js
   Vanilla JS terminal emulator with virtual file system
   ============================================================ */

(() => {
  'use strict';

  // ---- DOM References ----
  const output = document.getElementById('output');
  const inputEl = document.getElementById('command-input');
  const container = document.getElementById('terminal-container');
  const inputLineEl = document.getElementById('input-line');
  const typedTextEl = document.getElementById('typed-text');

  // ---- State ----
  let cwd = '~';
  let commandHistory = [];
  let historyIndex = -1;
  let idleTimer = null;
  let hintShown = false;
  let booted = false;

  // ================================================================
  //  VIRTUAL FILE SYSTEM
  //  Keys are absolute paths from ~.  'type' is 'dir' or 'file'.
  //  Directories have 'children' arrays.
  // ================================================================
  const FILE_SYSTEM = {
    '~': {
      type: 'dir',
      children: ['about.txt', 'skills.sh', 'contact.md', 'experience/', 'education/', 'projects/', 'certifications/'],
      hidden: ['.ssh/', '.coffee.txt']
    },
    '~/.coffee.txt': { type: 'file' },
    '~/.ssh': {
      type: 'dir',
      children: ['known_hosts']
    },
    '~/.ssh/known_hosts': { type: 'file' },
    '~/experience': {
      type: 'dir',
      children: ['edwards_analyst.txt', 'edwards_engineer.txt', 'zeus_systems.txt', 'win10_intern.txt']
    },
    '~/education': {
      type: 'dir',
      children: ['ut_arlington.txt', 'mumbai.txt']
    },
    '~/projects': {
      type: 'dir',
      children: ['autoredact', 'homelab.txt']
    },
    '~/certifications': {
      type: 'dir',
      children: ['certs.txt', 'publications.txt']
    },
    // Register every individual file so ls/cat can resolve them
    '~/about.txt': { type: 'file' },
    '~/skills.sh': { type: 'file' },
    '~/contact.md': { type: 'file' },
    '~/experience/edwards_analyst.txt': { type: 'file' },
    '~/experience/edwards_engineer.txt': { type: 'file' },
    '~/experience/zeus_systems.txt': { type: 'file' },
    '~/experience/win10_intern.txt': { type: 'file' },
    '~/education/ut_arlington.txt': { type: 'file' },
    '~/education/mumbai.txt': { type: 'file' },
    '~/projects/autoredact': { type: 'file' },
    '~/projects/homelab.txt': { type: 'file' },
    '~/certifications/certs.txt': { type: 'file' },
    '~/certifications/publications.txt': { type: 'file' }
  };

  // ================================================================
  //  FILE CONTENTS
  //  cat <file> reads from here.
  // ================================================================
  const FILE_CONTENTS = {
    '~/about.txt': `<span class="c-cyan bold">Karan Thakkar</span>
<span class="c-muted">Tipperary, Ireland · karant.dev@gmail.com</span>

I am a DevSecOps Engineer who likes to dabble in InfoSec.
Always interested in talking about things at the intersection
of technology, culture, and politics.`,

    '~/contact.md': `<span class="c-cyan bold">  ┌─ Contact ──────────────────────────────────┐</span>
  <span class="c-cyan">│</span>                                              <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-yellow">[in]</span>  <a href="https://www.linkedin.com/in/karan-thakkar97/" target="_blank">linkedin.com/in/karan-thakkar97</a>      <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-white">[gh]</span>  <a href="https://github.com/karant-dev" target="_blank">github.com/karant-dev</a>                <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-orange">[so]</span>  <a href="https://stackoverflow.com/users/21968353/karant" target="_blank">stackoverflow.com/.../karant</a>         <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-green">[bg]</span>  <a href="https://blog.karant.dev" target="_blank">blog.karant.dev</a>                      <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-magenta">[th]</span>  <a href="https://www.threads.net/@karant.dev" target="_blank">threads.net/@karant.dev</a>              <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-blue">[bs]</span>  <a href="https://bsky.app/profile/karant.dev" target="_blank">bsky.app/profile/karant.dev</a>          <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-white">[x.]</span>  <a href="https://x.com/karant_dev" target="_blank">x.com/karant_dev</a>                     <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-red">[@@]</span>  <a href="mailto:karant.dev@gmail.com">karant.dev@gmail.com</a>                 <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>                                              <span class="c-cyan">│</span>
<span class="c-cyan">  └───────────────────────────────────────────────┘</span>`,

    '~/experience/edwards_analyst.txt': `<span class="c-cyan bold">Edwards Lifesciences</span>  <span class="c-muted">|</span>  <span class="c-yellow">Senior Analyst</span>
<span class="c-muted">March 2025 — Present</span>
<span class="c-muted">────────────────────────────────────────────────</span>
Enterprise security, including Cloud Security Posture
Management (CSPM), DevSecOps and secure CI/CD.`,

    '~/experience/edwards_engineer.txt': `<span class="c-cyan bold">Edwards Lifesciences</span>  <span class="c-muted">|</span>  <span class="c-yellow">Senior Engineer</span>
<span class="c-muted">August 2022 — November 2024</span>
<span class="c-muted">────────────────────────────────────────────────</span>
Cloud Architecture and DevSecOps for internal and external
user-facing products. Set standards for SCM (Git), user
access (IAM) and pipeline orchestration (CI/CD). Create XR
experiences focusing on simulation and training.`,

    '~/experience/zeus_systems.txt': `<span class="c-cyan bold">Zeus Systems</span>  <span class="c-muted">|</span>  <span class="c-yellow">Senior Software Engineer</span>
<span class="c-muted">July 2018 — August 2020</span>
<span class="c-muted">────────────────────────────────────────────────</span>
Build and set up automation testing framework for web
projects including Jenkins pipelines. Implement automation
scripts for test cases and train a team of four to take
over the activity.`,

    '~/experience/win10_intern.txt': `<span class="c-cyan bold">Win-10 Technologies</span>  <span class="c-muted">|</span>  <span class="c-yellow">Software Engineer Intern</span>
<span class="c-muted">────────────────────────────────────────────────</span>
Build static company portfolio and product showcase website
with a 'get in touch' feature. Create automations to clean
and analyze enquiry data to generate leads. Develop an
invoicing module in Java.`,

    '~/education/ut_arlington.txt': `<span class="c-cyan bold">University of Texas Arlington</span>
<span class="c-yellow">Master of Science — Computer Science</span>
<span class="c-muted">August 2020 — May 2022  ·  GPA: 3.2</span>`,

    '~/education/mumbai.txt': `<span class="c-cyan bold">University of Mumbai</span>
<span class="c-yellow">Bachelor of Science — Computer Science</span>
<span class="c-muted">GPA: 3.4</span>`,

    '~/certifications/certs.txt': `<span class="c-yellow bold">Certifications</span>
<span class="c-muted">────────────────────────────────────────────────</span>
<span class="c-cyan">•</span> AWS — Solutions Architect Associate <span class="c-muted">(2023)</span>
<span class="c-cyan">•</span> AWS — Well-Architected Proficient <span class="c-muted">(2024)</span>
<span class="c-cyan">•</span> UTA — Graduate Certificate in Big Data Management
  and Data Sciences <span class="c-muted">(2022)</span>
<span class="c-cyan">•</span> UTA — Graduate Certificate in Deep Learning <span class="c-muted">(2022)</span>
<span class="c-cyan">•</span> CodePath — Android Developer <span class="c-muted">(2021)</span>
<span class="c-cyan">•</span> NPTEL — Modern Application Development <span class="c-muted">(2017)</span>`,

    '~/certifications/publications.txt': `<span class="c-yellow bold">Publications</span>
<span class="c-muted">────────────────────────────────────────────────</span>
<span class="c-cyan">•</span> Tracking Quality of Healthcare Services
  International Conference on Advances in Science
  and Technology <span class="c-muted">(2018)</span>`,

    '~/projects/homelab.txt': `<span class="c-cyan bold">Homelab Infrastructure</span>
<span class="c-muted">────────────────────────────────────────────────</span>
• Proxmox VE cluster with HA
• Pi-hole DNS + Unbound recursive resolver
• Plex & Jellyfin media servers
• Grafana + Prometheus monitoring stack
• WireGuard VPN mesh network`,

    '~/.ssh/known_hosts': `<span class="c-muted"># Known Hosts — Last updated 2026-01-15</span>
    <span class="c-cyan">roscrea.ie</span>      ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILhome...🏠==
    <span class="c-cyan">losangeles.ca</span>      ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMp2...k3Jw==
    <span class="c-cyan">dallas.tx</span>       ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBx9...r7Fg==
    <span class="c-cyan">mumbai.in</span>       ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINk7...a4Qw==`,

    // .coffee.txt — hidden easter egg, visible with ls -a
    '~/.coffee.txt': null  // placeholder — set after EASTER_EGGS is defined
  };

  // ================================================================
  //  COMMANDS REGISTRY
  //  Register new commands by adding a key → handler function.
  //  Handler receives (args: string[], rawInput: string).
  // ================================================================
  const COMMANDS = {};

  // ---- help ----
  COMMANDS['help'] = () => {
    return `<span class="c-cyan bold">Available Commands</span>
<span class="c-muted">────────────────────────────────────────────────</span>
  <span class="c-yellow">help</span>            Show this help message
  <span class="c-yellow">about</span>           Who am I?
  <span class="c-yellow">socials</span>         Links to my profiles
  <span class="c-yellow">ls</span> <span class="c-muted">[path]</span>       List directory contents
  <span class="c-yellow">cd</span> <span class="c-muted">&lt;dir&gt;</span>        Change directory
  <span class="c-yellow">cat</span> <span class="c-muted">&lt;file&gt;</span>      Read a file
  <span class="c-yellow">./</span><span class="c-muted">&lt;script&gt;</span>      Run an executable script
  <span class="c-yellow">clear</span>           Clear the terminal
  <span class="c-yellow">whoami</span>          Display current user identity
  <span class="c-yellow">pwd</span>             Print working directory
  <span class="c-yellow">history</span>         Show command history
  <span class="c-yellow">gui</span>             Open the graphical site
  <span class="c-yellow">neofetch</span>        System information
  <span class="c-yellow">date</span>            Current date & time

<span class="c-muted">  Try exploring the file system — there are hidden gems.</span>`;
  };

  // ---- about ----
  COMMANDS['about'] = () => FILE_CONTENTS['~/about.txt'];

  // ---- socials ----
  COMMANDS['socials'] = () => {
    return `<span class="c-cyan bold">  ┌─ Socials ───────────────────────────────────┐</span>
  <span class="c-cyan">│</span>                                              <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-yellow">[in]</span>  <a href="https://www.linkedin.com/in/karan-thakkar97/" target="_blank">linkedin.com/in/karan-thakkar97</a>      <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-white">[gh]</span>  <a href="https://github.com/karant-dev" target="_blank">github.com/karant-dev</a>                <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-orange">[so]</span>  <a href="https://stackoverflow.com/users/21968353/karant" target="_blank">stackoverflow.com/.../karant</a>         <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-green">[bg]</span>  <a href="https://blog.karant.dev" target="_blank">blog.karant.dev</a>                      <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-magenta">[th]</span>  <a href="https://www.threads.net/@karant.dev" target="_blank">threads.net/@karant.dev</a>              <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-blue">[bs]</span>  <a href="https://bsky.app/profile/karant.dev" target="_blank">bsky.app/profile/karant.dev</a>          <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-white">[x.]</span>  <a href="https://x.com/karant_dev" target="_blank">x.com/karant_dev</a>                     <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>  <span class="c-red">[@@]</span>  <a href="mailto:karant.dev@gmail.com">karant.dev@gmail.com</a>                 <span class="c-cyan">│</span>
  <span class="c-cyan">│</span>                                              <span class="c-cyan">│</span>
<span class="c-cyan">  └───────────────────────────────────────────────┘</span>`;
  };

  // ---- ls ----
  COMMANDS['ls'] = (args) => {
    const flags = args.filter(a => a.startsWith('-')).join('');
    const showHidden = flags.includes('a');
    const filtered = args.filter(a => !a.startsWith('-'));
    let targetPath = cwd;
    if (filtered.length > 0) {
      targetPath = resolvePath(filtered[0]);
    }

    const node = FILE_SYSTEM[targetPath];
    if (!node) {
      return `ls: cannot access '${filtered[0] || '.'}': No such file or directory`;
    }

    // If it's a file, just print the file name (real ls behavior)
    if (node.type === 'file') {
      const name = targetPath.split('/').pop();
      return `<span class="c-white">${name}</span>`;
    }

    // It's a directory — collect children, optionally include hidden
    let entries = [...node.children];
    if (showHidden && node.hidden) {
      entries = entries.concat(node.hidden);
    }

    const items = entries.map(c => {
      if (c.endsWith('/')) return `<span class="c-blue bold">${c}</span>`;
      // Check if it's an executable
      const childPath = targetPath === '~' ? `~/${c}` : `${targetPath}/${c}`;
      if (c.endsWith('.sh') || EXECUTABLES[c] || (FILE_SYSTEM[childPath] && c === 'autoredact')) {
        return `<span class="c-green bold">${c}</span>`;
      }
      return `<span class="c-white">${c}</span>`;
    });
    return items.join('    ');
  };

  // ---- cd ----
  COMMANDS['cd'] = (args) => {
    if (args.length === 0 || args[0] === '~') {
      cwd = '~';
      return '';
    }
    if (args[0] === '-') {
      // cd - : go to previous (simplified: just go home)
      cwd = '~';
      return '';
    }
    const target = resolvePath(args[0]);
    if (FILE_SYSTEM[target] && FILE_SYSTEM[target].type === 'dir') {
      cwd = target;
      return '';
    }
    if (FILE_SYSTEM[target] && FILE_SYSTEM[target].type === 'file') {
      return `bash: cd: ${args[0]}: Not a directory`;
    }
    return `bash: cd: ${args[0]}: No such file or directory`;
  };

  // ---- pwd ----
  COMMANDS['pwd'] = () => cwd === '~' ? '/home/guest' : `/home/guest/${cwd.slice(2)}`;

  // ---- cat ----
  COMMANDS['cat'] = (args, rawInput) => {
    // Easter egg: cat coffee.txt
    // if (args[0] === 'coffee.txt') {
    //   return EASTER_EGGS['cat coffee.txt']();
    // }
    if (args.length === 0) return 'cat: missing operand';

    // Support multiple files: cat file1 file2
    const results = [];
    for (const arg of args) {
      const filePath = resolvePath(arg);
      const node = FILE_SYSTEM[filePath];

      if (!node) {
        results.push(`cat: ${arg}: No such file or directory`);
        continue;
      }
      if (node.type === 'dir') {
        results.push(`cat: ${arg}: Is a directory`);
        continue;
      }
      if (FILE_CONTENTS[filePath]) {
        results.push(FILE_CONTENTS[filePath]);
      } else {
        results.push(`cat: ${arg}: No such file or directory`);
      }
    }
    return results.join('\n');
  };

  // ---- clear ----
  COMMANDS['clear'] = () => {
    output.innerHTML = '';
    return '';
  };

  // ---- whoami ----
  COMMANDS['whoami'] = () => `Senior Security Analyst. Defender of clouds. Breaker of monolithic pipelines.`;

  // ---- history ----
  COMMANDS['history'] = () => {
    if (commandHistory.length === 0) return '<span class="c-muted">No commands in history.</span>';
    return commandHistory.map((cmd, i) => `  <span class="c-muted">${String(i + 1).padStart(4)}</span>  ${escapeHtml(cmd)}`).join('\n');
  };

  // ---- date ----
  COMMANDS['date'] = () => new Date().toString();

  // ---- echo ----
  COMMANDS['echo'] = (args) => args.join(' ');

  // ---- neofetch ----
  COMMANDS['neofetch'] = () => {
    return `<span class="c-cyan bold">        .--.        </span>   <span class="c-cyan bold">guest</span><span class="c-muted">@</span><span class="c-magenta bold">karant.dev</span>
<span class="c-cyan bold">       |o_o |       </span>   <span class="c-muted">──────────────────</span>
<span class="c-cyan bold">       |:_/ |       </span>   <span class="c-yellow">OS:</span>     Debian 12 (Bookworm)
<span class="c-cyan bold">      //   \\ \\      </span>   <span class="c-yellow">Host:</span>   Proxmox VE 8.1
<span class="c-cyan bold">     (|     | )     </span>   <span class="c-yellow">Kernel:</span> 6.5.13-pve
<span class="c-cyan bold">    /'\\_   _/\`\\    </span>   <span class="c-yellow">Shell:</span>  zsh 5.9
<span class="c-cyan bold">    \\___)=(___/    </span>   <span class="c-yellow">Uptime:</span> 420 days
                       <span class="c-yellow">CPU:</span>    AMD Ryzen 7 5800X
                       <span class="c-yellow">Memory:</span> 32GB DDR4 ECC`;
  };

  // ---- gui ----
  COMMANDS['gui'] = () => {
    setTimeout(() => {
      window.open('https://karant.dev', '_blank');
    }, 1200);
    return `<span class="c-yellow">Initiating GUI sequence...</span>
<span class="c-muted">Redirecting to</span> <a href="https://karant.dev" target="_blank">karant.dev</a> <span class="c-muted">in a new tab...</span>`;
  };

  // ---- touch / mkdir / rm / chmod — realistic "permission denied" ----
  COMMANDS['touch'] = (args) => {
    if (args.length === 0) return 'touch: missing file operand';
    return `touch: cannot touch '${args[0]}': Read-only file system`;
  };
  COMMANDS['mkdir'] = (args) => {
    if (args.length === 0) return 'mkdir: missing operand';
    return `mkdir: cannot create directory '${args[0]}': Read-only file system`;
  };
  COMMANDS['rm'] = (args) => {
    if (args.length === 0) return 'rm: missing operand';
    return `rm: cannot remove '${args[0]}': Read-only file system`;
  };
  COMMANDS['mv'] = (args) => {
    if (args.length < 2) return 'mv: missing destination file operand';
    return `mv: cannot move '${args[0]}': Read-only file system`;
  };
  COMMANDS['cp'] = (args) => {
    if (args.length < 2) return 'cp: missing destination file operand';
    return `cp: cannot copy '${args[0]}': Read-only file system`;
  };
  COMMANDS['chmod'] = () => `chmod: changing permissions: Operation not permitted`;
  COMMANDS['chown'] = () => `chown: changing ownership: Operation not permitted`;

  // ---- uname ----
  COMMANDS['uname'] = (args) => {
    if (args.includes('-a')) return 'Linux karant.dev 6.5.13-pve #1 SMP x86_64 GNU/Linux';
    return 'Linux';
  };

  // ---- man ----
  COMMANDS['man'] = (args) => {
    if (args.length === 0) return 'What manual page do you want?';
    return `<span class="c-muted">No manual entry for ${escapeHtml(args[0])}. Try 'help'.</span>`;
  };

  // ---- which ----
  COMMANDS['which'] = (args) => {
    if (args.length === 0) return '';
    if (COMMANDS[args[0]]) return `/usr/local/bin/${args[0]}`;
    return `${args[0]} not found`;
  };

  // ---- exit ----
  COMMANDS['exit'] = () => {
    return `<span class="c-muted">logout</span>
<span class="c-muted">There is nowhere to go. You are already home.</span>`;
  };

  // ================================================================
  //  EXECUTABLE SCRIPTS
  //  ./script dispatches here.
  // ================================================================
  const EXECUTABLES = {};

  // ---- skills.sh ----
  EXECUTABLES['skills.sh'] = () => {
    const skills = [
      { name: 'AWS', pct: 92, color: 'c-orange' },
      { name: 'Kubernetes', pct: 88, color: 'c-blue' },
      { name: 'Python', pct: 85, color: 'c-yellow' },
      { name: 'Docker', pct: 90, color: 'c-cyan' },
      { name: 'Terraform', pct: 87, color: 'c-magenta' }
    ];
    const barWidth = 30;
    let out = `<span class="c-cyan bold">  Skill Proficiency</span>\n<span class="c-muted">  ────────────────────────────────────────────────</span>\n`;
    skills.forEach(s => {
      const filled = Math.round((s.pct / 100) * barWidth);
      const empty = barWidth - filled;
      const bar = `<span class="${s.color}">${'█'.repeat(filled)}</span><span class="c-muted">${'░'.repeat(empty)}</span>`;
      out += `  <span class="c-white">${s.name.padEnd(14)}</span>${bar}  <span class="${s.color} bold">${s.pct}%</span>\n`;
    });
    return out.trimEnd();
  };

  // ---- autoredact ----
  EXECUTABLES['autoredact'] = (args) => {
    if (args.includes('--help') || args.includes('-h')) {
      return `<span class="c-cyan bold">AutoRedact</span> <span class="c-muted">v2.1.2</span>

<span class="c-white">An open-source web application for automated data redaction.</span>

AutoRedact uses OCR and pattern-matching to automatically detect
and redact Personally Identifiable Information (PII) from uploaded
documents and images — eliminating tedious manual work.

<span class="c-yellow bold">Features:</span>
  • Automatic PII detection (names, SSNs, emails, phone numbers)
  • Supports PDF, PNG, JPG, and TIFF formats
  • Client-side processing — your data never leaves the browser
  • Configurable redaction profiles via JSON settings
  • REST API for headless / CI pipeline integration

<span class="c-yellow bold">Usage:</span>  autoredact [options] &lt;input_file&gt;

<span class="c-yellow bold">Links:</span>
  <a href="https://github.com/karant/autoredact" target="_blank">https://github.com/karant/autoredact</a>`;
    }
    return `<span class="c-red">autoredact:</span> missing input file. Run <span class="c-yellow">./autoredact --help</span> for usage.`;
  };

  EXECUTABLES['coffee'] = () => EASTER_EGGS['cat coffee.txt']();

  // ================================================================
  //  EASTER EGGS
  //  Exact-match commands that take priority.
  // ================================================================
  const EASTER_EGGS = {};

  EASTER_EGGS['docker ps'] = () => {
    const header = `<span class="docker-header">CONTAINER ID   IMAGE                    COMMAND       CREATED        STATUS             PORTS                    NAMES</span>`;
    const rows = [
      `<span class="docker-table">a1b2c3d4e5f6   pihole/pihole            "/s6-init"    14 months ago  Up 420 Days        0.0.0.0:53->53/tcp       pihole</span>`,
      `<span class="docker-table">f6e5d4c3b2a1   linuxserver/plex         "/init"       14 months ago  Up 420 Days        0.0.0.0:32400->32400/tcp plex</span>`,
      `<span class="docker-table">1a2b3c4d5e6f   jellyfin/jellyfin        "/jellyfin"   14 months ago  Up 420 Days        0.0.0.0:8096->8096/tcp   jellyfin</span>`
    ];
    return header + '\n' + rows.join('\n');
  };

  EASTER_EGGS['ping home'] = () => {
    return `PING roscrea.ie (192.168.1.1): 56 data bytes
64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=0.42 ms
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.38 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=0.41 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=0.39 ms

--- roscrea.ie ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.38/0.40/0.42/0.015 ms`;
  };

  EASTER_EGGS['cat ~/.ssh/known_hosts'] = () => {
    return `<span class="c-muted"># Known Hosts — Last updated 2026-01-15</span>
    <span class="c-cyan">roscrea.ie</span>      ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILhome...🏠==
    <span class="c-cyan">losangeles.ca</span>      ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMp2...k3Jw==
    <span class="c-cyan">dallas.tx</span>       ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBx9...r7Fg==
    <span class="c-cyan">mumbai.in</span>       ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINk7...a4Qw==`;
  };

  EASTER_EGGS['cat coffee.txt'] = () => {
    // Build the box dynamically so span tags don't break alignment
    const W = 28; // inner width
    const top = '  +' + '-'.repeat(W) + '+';
    const bot = '  +' + '-'.repeat(W) + '+';
    const blank = '  |' + ' '.repeat(W) + '|';
    const pad = (vis, html) => {
      const fill = W - vis.length;
      return '  |' + html + ' '.repeat(fill > 0 ? fill : 0) + '|';
    };
    return `<span class="ascii-art">
        ╱|、
       (˚ˎ 。7
        |、˜〵
        じしˍ,)ノ

${top}
${blank}
${pad('  Name:   Coffee', '  <span class="c-white">Name:   Coffee</span>')}
${pad('  Type:   Calico', '  <span class="c-white">Type:   Calico</span>')}
${pad('  Role:   Chief Meow Officer', '  <span class="c-white">Role:   Chief Meow Officer</span>')}
${pad('  Status: Napping ♥', '  <span class="c-white">Status: Napping</span> <span class="c-red">♥</span>')}
${blank}
${bot}

        <span class="c-orange">~(=^‥^)ノ</span>    <span class="c-muted">meow.</span>
</span>`;
  };

  // Backfill .coffee.txt content now that EASTER_EGGS is defined
  FILE_CONTENTS['~/.coffee.txt'] = EASTER_EGGS['cat coffee.txt']();

  // ================================================================
  //  BOOT SEQUENCE
  // ================================================================
  const BOOT_LINES = [
    { text: 'BIOS POST... Memory check: 32768 MB OK', status: 'ok' },
    { text: 'Initializing kernel 6.5.13-pve...', status: 'ok' },
    { text: 'Mounting filesystems...', status: 'ok' },
    { text: 'Starting sshd daemon...', status: 'ok' },
    { text: 'Loading container_runtime (containerd)...', status: 'ok' },
    { text: 'Syncing terraform_state from S3...', status: 'ok' },
    { text: 'Starting devsecopsd daemon...', status: 'ok' },
    { text: 'Verifying compliance_baseline: SOC 2 / HIPAA...', status: 'ok' },
    { text: 'All checks passed. System ready.', status: 'done' }
  ];

  async function runBootSequence() {
    // Build the welcome box dynamically so alignment is guaranteed
    const BW = 50; // inner width
    const eq = '='.repeat(BW);
    const bpad = (vis, html) => {
      const fill = BW - vis.length;
      return '|' + html + ' '.repeat(fill > 0 ? fill : 0) + '|';
    };
    const bempty = '|' + ' '.repeat(BW) + '|';

    // Block art lines — only uses chars that render reliably in monospace
    // Each visible string is paired with its HTML version
    const artLines = [
      ['', ''],
      ['   █▄▀  ▄▀█  █▀█  ▄▀█  █▄ █', '   █▄▀  ▄▀█  █▀█  ▄▀█  █▄ █'],
      ['   █ █  █▀█  █▀▄  █▀█  █ ▀█', '   █ █  █▀█  █▀▄  █▀█  █ ▀█'],
      ['', ''],
      ['   ▀█▀  █ █  ▄▀█  █▄▀  █▄▀  ▄▀█  █▀█', '   ▀█▀  █ █  ▄▀█  █▄▀  █▄▀  ▄▀█  █▀█'],
      ['    █   █▀█  █▀█  █ █  █ █  █▀█  █▀▄', '    █   █▀█  █▀█  █ █  █ █  █▀█  █▀▄'],
      ['', ''],
    ];

    let artBlock = '';
    for (const [vis, html] of artLines) {
      artBlock += bpad(vis, html) + '\n';
    }

    const welcome = `<span class="c-cyan bold">+${eq}+
${artBlock}${bpad('   DevSecOps Engineer · Security Analyst', '   <span class="c-white">DevSecOps Engineer · Security Analyst</span>')}
${bpad('   karant.dev — v1.0.0', '   <span class="c-muted">karant.dev — v1.0.0</span>')}
${bempty}
+${eq}+</span>`;

    for (let i = 0; i < BOOT_LINES.length; i++) {
      const line = BOOT_LINES[i];
      const statusTag = line.status === 'ok'
        ? '<span class="boot-ok">  [OK]</span>'
        : '<span class="c-cyan bold">  [DONE]</span>';
      appendRaw(`<span class="boot-line">${line.text}</span>${statusTag}`);
      scrollToBottom();
      await sleep(80 + Math.random() * 100);
    }

    await sleep(300);
    appendRaw('');
    appendRaw(welcome);
    appendRaw('');
    appendRaw(`<span class="c-muted">Type '<span class="c-yellow">help</span>' for commands, '<span class="c-yellow">ls</span>' to explore, or '<span class="c-yellow">gui</span>' for the graphical site.</span>`);
    appendRaw('');
    scrollToBottom();

    booted = true;
    inputLineEl.style.display = 'flex';
    inputEl.focus();
  }

  // ================================================================
  //  COMMAND DISPATCHER
  // ================================================================
  function executeCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Render the prompt + command in output
    appendRaw(buildPromptHTML() + escapeHtml(trimmed));

    // Check for sudo
    if (trimmed.startsWith('sudo ')) {
      appendRaw(`<span class="c-red">[sudo] password for guest:</span>
<span class="c-red bold">guest is not in the sudoers file. This incident will be reported to the Edwards Lifesciences SOC.</span>`);
      scrollToBottom();
      return;
    }

    // Check easter eggs (exact match)
    if (EASTER_EGGS[trimmed]) {
      const result = EASTER_EGGS[trimmed]();
      if (result) appendRaw(result);
      scrollToBottom();
      return;
    }

    // Parse command and args
    const parts = trimmed.split(/\s+/);
    let cmd = parts[0];
    let args = parts.slice(1);

    // Handle ./ execution
    if (cmd.startsWith('./')) {
      const scriptName = cmd.slice(2);
      if (EXECUTABLES[scriptName]) {
        const result = EXECUTABLES[scriptName](args);
        if (result) appendRaw(result);
      } else {
        appendRaw(`bash: ./${scriptName}: No such file or directory`);
      }
      scrollToBottom();
      return;
    }

    // Handle cat (may be easter egg with full path)
    if (cmd === 'cat') {
      const result = COMMANDS['cat'](args, trimmed);
      if (result) appendRaw(result);
      scrollToBottom();
      return;
    }

    // Handle registered commands
    if (COMMANDS[cmd]) {
      const result = COMMANDS[cmd](args, trimmed);
      if (result) appendRaw(result);
    } else {
      appendRaw(`<span class="c-red">bash: ${escapeHtml(cmd)}: command not found</span>  <span class="c-muted">Try 'help'.</span>`);
    }

    scrollToBottom();
  }

  // ================================================================
  //  PATH RESOLUTION
  //  Handles: ~, .., ., absolute ~/paths, and relative paths
  //  including nested paths like experience/edwards_analyst.txt
  // ================================================================
  function resolvePath(input) {
    let cleaned = input.replace(/\/+$/, ''); // strip trailing slash

    // Already absolute from ~
    if (cleaned.startsWith('~/')) return cleaned;
    if (cleaned === '~') return '~';

    // Handle .. navigation
    if (cleaned === '..') {
      if (cwd === '~') return '~';
      const parts = cwd.split('/');
      parts.pop();
      return parts.join('/') || '~';
    }
    if (cleaned === '.') return cwd;

    // Handle paths with .. segments (e.g., ../education)
    if (cleaned.startsWith('../')) {
      let base = cwd;
      let remaining = cleaned;
      while (remaining.startsWith('../')) {
        if (base !== '~') {
          const parts = base.split('/');
          parts.pop();
          base = parts.join('/') || '~';
        }
        remaining = remaining.slice(3);
      }
      if (!remaining) return base;
      return base === '~' ? `~/${remaining}` : `${base}/${remaining}`;
    }

    // Relative path from cwd
    return cwd === '~' ? `~/${cleaned}` : `${cwd}/${cleaned}`;
  }

  // ================================================================
  //  PROMPT BUILDER
  // ================================================================
  function buildPromptHTML() {
    const displayPath = cwd === '~' ? '~' : cwd.replace('~', '~');
    return `<span class="prompt-text"><span class="prompt-user">guest</span><span class="prompt-at">@</span><span class="prompt-host">karant.dev</span>:<span class="prompt-path">${displayPath}</span><span class="prompt-dollar">$ </span></span>`;
  }

  function updatePrompt() {
    const promptEl = document.getElementById('prompt-display');
    if (promptEl) promptEl.innerHTML = buildPromptHTML();
  }

  // ================================================================
  //  OUTPUT HELPERS
  // ================================================================
  function appendRaw(html) {
    const div = document.createElement('div');
    div.className = 'line';
    div.innerHTML = html;
    output.appendChild(div);
  }

  function scrollToBottom() {
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ================================================================
  //  IDLE HINT  (disabled — info is in the boot welcome line)
  // ================================================================
  function resetIdleTimer() {
    // no-op: the boot message already tells the user what to do
  }

  // ================================================================
  //  TAB COMPLETION
  //  Handles: bare commands, ./ executables, and file/dir arguments
  // ================================================================
  function tabComplete() {
    const value = inputEl.value;
    const parts = value.split(/\s+/);

    // 1. No text yet
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return;

    // 2. Completing ./ prefix (executables)
    if (parts.length === 1 && parts[0].startsWith('./')) {
      const partial = parts[0].slice(2);
      const candidates = Object.keys(EXECUTABLES);
      const matches = candidates.filter(c => c.startsWith(partial) && c !== partial);
      if (matches.length === 1) {
        inputEl.value = './' + matches[0] + ' ';
      } else if (matches.length > 1) {
        appendRaw(buildPromptHTML() + escapeHtml(value));
        appendRaw(matches.map(m => './' + m).join('    '));
        scrollToBottom();
      }
      typedTextEl.textContent = inputEl.value;
      return;
    }

    // 3. Completing a bare command (first word, no ./)
    if (parts.length === 1) {
      const partial = parts[0];
      const allCmds = Object.keys(COMMANDS);
      const matches = allCmds.filter(c => c.startsWith(partial) && c !== partial);
      if (matches.length === 1) {
        inputEl.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        appendRaw(buildPromptHTML() + escapeHtml(value));
        appendRaw(matches.join('    '));
        scrollToBottom();
      }
      typedTextEl.textContent = inputEl.value;
      return;
    }

    // 4. Completing an argument (second+ word)
    const cmd = parts[0];
    const argPartial = parts[parts.length - 1] || '';

    // Handle ./ in argument position
    if (argPartial.startsWith('./')) {
      const scriptPartial = argPartial.slice(2);
      const exeMatches = Object.keys(EXECUTABLES).filter(
        c => c.startsWith(scriptPartial) && c !== scriptPartial
      );
      if (exeMatches.length === 1) {
        parts[parts.length - 1] = './' + exeMatches[0];
        inputEl.value = parts.join(' ') + ' ';
      }
      typedTextEl.textContent = inputEl.value;
      return;
    }

    // Determine the directory context and partial filename
    let searchDir = cwd;
    let filePartial = argPartial;

    // If the partial contains a /, split into dir + file partial
    if (argPartial.includes('/')) {
      const lastSlash = argPartial.lastIndexOf('/');
      const dirPart = argPartial.slice(0, lastSlash);
      filePartial = argPartial.slice(lastSlash + 1);
      searchDir = resolvePath(dirPart);
    }

    const dirNode = FILE_SYSTEM[searchDir];
    if (!dirNode || dirNode.type !== 'dir') {
      typedTextEl.textContent = inputEl.value;
      return;
    }

    // Include hidden entries when the user types a dot prefix
    let entries = [...dirNode.children];
    if (dirNode.hidden && filePartial.startsWith('.')) {
      entries = entries.concat(dirNode.hidden);
    }
    let candidates = entries.map(c => c.replace(/\/$/, ''));

    // For cd, only show directories
    if (cmd === 'cd') {
      let cdEntries = [...dirNode.children];
      if (dirNode.hidden && filePartial.startsWith('.')) {
        cdEntries = cdEntries.concat(dirNode.hidden);
      }
      candidates = cdEntries
        .filter(c => c.endsWith('/'))
        .map(c => c.replace(/\/$/, ''));
    }

    const matches = candidates.filter(c => c.startsWith(filePartial) && c !== filePartial);

    // Reconstruct the prefix (dir part of the arg, if any)
    const argPrefix = argPartial.includes('/') ? argPartial.slice(0, argPartial.lastIndexOf('/') + 1) : '';

    if (matches.length === 1) {
      parts[parts.length - 1] = argPrefix + matches[0];
      inputEl.value = parts.join(' ');
      const resolvedPath = resolvePath(parts[parts.length - 1]);
      if (FILE_SYSTEM[resolvedPath] && FILE_SYSTEM[resolvedPath].type === 'dir') {
        // don't add space for dirs
      } else {
        inputEl.value += ' ';
      }
    } else if (matches.length > 1) {
      const common = longestCommonPrefix(matches);
      if (common.length > filePartial.length) {
        parts[parts.length - 1] = argPrefix + common;
        inputEl.value = parts.join(' ');
      } else {
        appendRaw(buildPromptHTML() + escapeHtml(value));
        appendRaw(matches.join('    '));
        scrollToBottom();
      }
    }

    typedTextEl.textContent = inputEl.value;
  }

  function longestCommonPrefix(strs) {
    if (strs.length === 0) return '';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (strs[i].indexOf(prefix) !== 0) {
        prefix = prefix.slice(0, -1);
        if (prefix === '') return '';
      }
    }
    return prefix;
  }

  // ================================================================
  //  INPUT HANDLING
  // ================================================================
  inputEl.addEventListener('keydown', (e) => {
    if (!booted) { e.preventDefault(); return; }
    resetIdleTimer();

    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputEl.value;
      inputEl.value = '';
      typedTextEl.textContent = '';
      executeCommand(val);
      updatePrompt();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        historyIndex = Math.max(0, historyIndex - 1);
        inputEl.value = commandHistory[historyIndex] || '';
        typedTextEl.textContent = inputEl.value;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        inputEl.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        inputEl.value = '';
      }
      typedTextEl.textContent = inputEl.value;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      tabComplete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS['clear']();
    }
  });

  inputEl.addEventListener('input', () => {
    typedTextEl.textContent = inputEl.value;
  });

  // Keep input focused
  document.addEventListener('click', () => {
    if (booted) inputEl.focus();
  });

  document.addEventListener('keydown', (e) => {
    if (booted && document.activeElement !== inputEl) {
      inputEl.focus();
    }
  });

  // ================================================================
  //  INITIALISE
  // ================================================================
  inputLineEl.style.display = 'none';
  runBootSequence();

})();
