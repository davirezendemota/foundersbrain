# Bootstrap multi-OS

- `lib/os-detect.sh` — define `SB_OS_KERNEL`, `SB_OS_FAMILY` (`darwin`, `linux`, `freebsd`, `openbsd`, `windows`, `unknown`), `SB_OS_DISPLAY` e `SB_PKG_MANAGER` (`brew`, `apt`, `dnf`, `yum`, `pacman`, `zypper`, `apk`, `pkg`, `xbps`, `pkg_add`, `winget`, `choco`, `scoop`, `none`).
- `lib/pkg.sh` — `bootstrap_pkg_refresh` e `bootstrap_pkg_install` usam a API do gestor detetado; `bootstrap_pkg_nodejs` cobre variações de pacotes Node/npm.

O `bootstrap.sh` na pasta pai carrega estes ficheiros, regista o SO detetado e instala dependências nativas antes do resto do fluxo.
