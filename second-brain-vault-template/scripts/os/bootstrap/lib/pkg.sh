# shellcheck shell=bash
# Instalação de pacotes via API nativa do SO (sourced após os-detect.sh).
# Usa: SB_PKG_MANAGER SB_OS_FAMILY

: "${SB_PKG_MANAGER:=none}"

bootstrap_pkg_refreshed=0

bootstrap_pkg_refresh() {
  [[ "$bootstrap_pkg_refreshed" == 1 ]] && return 0
  case "$SB_PKG_MANAGER" in
    apt)
      sudo apt-get update -qq
      ;;
    dnf)
      sudo dnf makecache -y -q 2>/dev/null || true
      ;;
    yum)
      sudo yum makecache -y -q 2>/dev/null || true
      ;;
    zypper)
      sudo zypper --gpg-auto-import-keys refresh -q 2>/dev/null || true
      ;;
    pacman)
      sudo pacman -Sy --noconfirm 2>/dev/null || true
      ;;
    apk)
      sudo apk update -q
      ;;
    pkg)
      sudo env ASSUME_ALWAYS_YES=yes pkg update -q 2>/dev/null || sudo pkg update -q
      ;;
    xbps)
      sudo xbps-install -Su 2>/dev/null || true
      ;;
    brew)
      brew update --quiet 2>/dev/null || brew update || true
      ;;
  esac
  bootstrap_pkg_refreshed=1
}

# Instala pacotes com os nomes usados pelo gestor nativo (git, tmux, …).
bootstrap_pkg_install() {
  local -a pkgs=("$@")
  (( ${#pkgs[@]} )) || return 0
  case "$SB_PKG_MANAGER" in
    brew)
      brew install "${pkgs[@]}"
      ;;
    apt)
      bootstrap_pkg_refresh
      sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "${pkgs[@]}"
      ;;
    dnf)
      bootstrap_pkg_refresh
      sudo dnf install -y "${pkgs[@]}"
      ;;
    yum)
      sudo yum install -y "${pkgs[@]}"
      ;;
    pacman)
      bootstrap_pkg_refresh
      sudo pacman -Sy --noconfirm "${pkgs[@]}"
      ;;
    zypper)
      bootstrap_pkg_refresh
      sudo zypper --non-interactive install -y "${pkgs[@]}"
      ;;
    apk)
      bootstrap_pkg_refresh
      sudo apk add --no-cache "${pkgs[@]}"
      ;;
    pkg)
      bootstrap_pkg_refresh
      sudo pkg install -y "${pkgs[@]}"
      ;;
    pkg_add)
      local p
      for p in "${pkgs[@]}"; do
        if command -v doas &>/dev/null; then
          doas pkg_add -I "$p" 2>/dev/null || sudo pkg_add -I "$p"
        else
          sudo pkg_add -I "$p"
        fi
      done
      ;;
    xbps)
      sudo xbps-install -y "${pkgs[@]}"
      ;;
    none)
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

bootstrap_pkg_nodejs() {
  case "$SB_OS_FAMILY" in
    freebsd)
      bootstrap_pkg_install node npm 2>/dev/null || bootstrap_pkg_install node
      ;;
    darwin|linux|openbsd)
      case "$SB_PKG_MANAGER" in
        brew)  bootstrap_pkg_install node ;;
        apt)   bootstrap_pkg_refresh; sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm 2>/dev/null || sudo apt-get install -y nodejs ;;
        dnf|yum) bootstrap_pkg_install nodejs npm ;;
        pacman) bootstrap_pkg_install nodejs npm ;;
        zypper) bootstrap_pkg_install nodejs npm 2>/dev/null || bootstrap_pkg_install nodejs22 npm22 2>/dev/null || bootstrap_pkg_install nodejs ;;
        apk)   bootstrap_pkg_install nodejs npm ;;
        pkg)   bootstrap_pkg_install node npm ;;
        pkg_add) bootstrap_pkg_install node ;;
        *)     return 1 ;;
      esac
      ;;
    windows)
      case "${SB_PKG_MANAGER:-none}" in
        winget)
          winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements -h
          ;;
        choco)
          choco install -y nodejs-lts
          ;;
        scoop)
          scoop install nodejs-lts
          ;;
        *)
          return 1
          ;;
      esac
      ;;
    *)
      return 1
      ;;
  esac
}
