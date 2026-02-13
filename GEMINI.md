# Terminal Portfolio — karant.dev

## Overview
An interactive, CRT-styled terminal emulator portfolio website for a DevSecOps Engineer / Senior Security Analyst. Built with vanilla HTML, CSS, and JavaScript — no external libraries.

## Files
| File         | Purpose                                                        |
| ------------ | -------------------------------------------------------------- |
| `index.html` | HTML shell with SEO meta tags, CRT wrapper, prompt, and input  |
| `style.css`  | CRT effects (scanlines, flicker), colors, layout               |
| `script.js`  | Terminal engine: virtual file system, command parser, boot seq  |

## Architecture
- **Virtual File System** — `FILE_SYSTEM` object defines directory tree; individual files are also registered by path for `ls`/`cat` resolution. `FILE_CONTENTS` stores file text. Adding a new file = adding a key to each object.
- **Command Registry** — `COMMANDS` object maps command names to handler functions. Add a new command by adding a key → function.
- **Executables** — `EXECUTABLES` object handles `./script` invocations (e.g. `./skills.sh`, `./autoredact`).
- **Easter Eggs** — `EASTER_EGGS` object stores exact-match hidden commands (`docker ps`, `ping home`, etc.).
- **Path Resolution** — `resolvePath()` handles `~`, `.`, `..`, `../`, and nested relative paths like `experience/edwards_analyst.txt`.

## Available Commands
`help`, `about`, `socials`, `ls`, `cd`, `cat`, `pwd`, `clear`, `whoami`, `echo`, `history`, `gui`, `neofetch`, `date`, `uname`, `man`, `which`, `exit`, `touch`, `mkdir`, `rm`, `mv`, `cp`, `chmod`, `chown`, `./skills.sh`, `./autoredact --help`, `./coffee`

## Tab Completion
Full tab completion support: commands (`hel`→`help`), files (`cat abo`→`cat about.txt`), executables (`./ski`→`./skills.sh`), directories (`cd exp`→`cd experience`), nested paths (`ls experience/ed`→`ls experience/edwards_analyst.txt`), and hidden dotfiles when typing `.` prefix (`cd .s`→`cd .ssh`). Ambiguous matches show all possibilities.

- `ls -a` — includes hidden dotfiles/dirs (`.ssh/`, `.coffee.txt`)
- `ls <file>` — prints just the filename (real ls behavior)
- `ls <dir>/<file>` — resolves nested paths from current directory
- `cat <dir>/<file>` — reads files via nested paths
- `cat <dir>` — returns "Is a directory"
- `cat` (no args) — returns "missing operand"
- `cat file1 file2` — supports multiple file arguments
- `cd <file>` — returns "Not a directory"
- `touch`/`mkdir`/`rm`/`mv`/`cp` — "Read-only file system"
- `chmod`/`chown` — "Operation not permitted"
- `sudo <anything>` — SOC incident report

## Hidden Easter Eggs
- `docker ps` — homelab container table
- `ping home` — pings roscrea.ie
- `cat ~/.ssh/known_hosts` or `cat .ssh/known_hosts` — spoofed global server keys
- `cat .coffee.txt` / `cat coffee.txt` / `./coffee` — ASCII calico cat (Coffee) (`.coffee.txt` discoverable via `ls -a`)
- `sudo <anything>` — SOC incident warning
- `whoami` — identity tagline
- `gui` — opens https://karant.dev in a new tab

## Virtual File System Structure
```
~
├── about.txt               # Bio
├── skills.sh               # Executable skill bars
├── contact.md              # Social links in terminal box
├── .coffee.txt             # Hidden (ls -a) — ASCII cat easter egg
├── .ssh/                   # Hidden (ls -a to see)
│   └── known_hosts         # Spoofed SSH known hosts
├── experience/
│   ├── edwards_analyst.txt # Edwards Lifesciences — Senior Analyst
│   ├── edwards_engineer.txt# Edwards Lifesciences — Senior Engineer
│   ├── zeus_systems.txt    # Zeus Systems — Senior SWE
│   └── win10_intern.txt    # Win-10 Technologies — Intern
├── education/
│   ├── ut_arlington.txt    # MS Computer Science
│   └── mumbai.txt          # BS Computer Science
├── projects/
│   ├── autoredact          # AutoRedact project
│   └── homelab.txt         # Homelab infra
└── certifications/
    ├── certs.txt           # AWS, UTA, CodePath, NPTEL
    └── publications.txt    # Healthcare tracking paper
```

## Social Links
LinkedIn, GitHub, StackOverflow, Blog, Threads, Bluesky, X, Email — displayed in a terminal-style box with color-coded `[in]`/`[gh]`/`[so]` etc. bracket icons.

## How to Host
Static files — deploy to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, S3 + CloudFront, etc.). No build step required.

## How to Extend
1. **New file:** Add path to `FILE_SYSTEM[parentDir].children` array (or `.hidden` array for dotfiles), register `FILE_SYSTEM['~/path/to/file'] = { type: 'file' }`, then add content to `FILE_CONTENTS`.
2. **New command:** Add a key → handler function to `COMMANDS`.
3. **New executable:** Add to `EXECUTABLES`.
4. **New easter egg:** Add exact-match string → handler to `EASTER_EGGS`.
