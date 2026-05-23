# shellcheck shell=bash
# Deteção de SO e gestor de pacotes nativo (sourced por bootstrap.sh).
# Exporta: SB_OS_KERNEL SB_OS_FAMILY SB_OS_DISPLAY SB_PKG_MANAGER

bootstrap_init_brew_path() {
  command -v brew &>/dev/null && return 0
  [[ -x /opt/homebrew/bin/brew ]] && export PATH="/opt/homebrew/bin:${PATH}"
  [[ -x /usr/local/bin/brew ]] && export PATH="/usr/local/bin:${PATH}"
}

bootstrap_detect_linux_pkg() {
  local id id_like combined
  if [[ -r /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    id="${ID:-}"
    id_like="${ID_LIKE:-}"
    combined="${id_like} ${id} "
    case "$combined" in
      *alpine*) echo apk; return ;;
      *debian*|*ubuntu*|*raspbian*|*linuxmint*|*pop*) echo apt; return ;;
      *fedora*|*rhel*|*centos*|*rocky*|*alma*|*ol*|*nobara*) echo dnf; return ;;
      *arch*|*manjaro*|*endeavouros*|*artix*) echo pacman; return ;;
      *opensuse*|*suse*|*sled*|*sles*) echo zypper; return ;;
      *void*) echo xbps; return ;;
    esac
  fi
  command -v apt-get &>/dev/null && { echo apt; return; }
  command -v dnf &>/dev/null && { echo dnf; return; }
  command -v yum &>/dev/null && { echo yum; return; }
  command -v pacman &>/dev/null && { echo pacman; return; }
  command -v zypper &>/dev/null && { echo zypper; return; }
  command -v apk &>/dev/null && { echo apk; return; }
  command -v xbps-install &>/dev/null && { echo xbps; return; }
  echo none
}

bootstrap_detect_windows_pkg() {
  command -v winget &>/dev/null && { echo winget; return; }
  command -v choco &>/dev/null && { echo choco; return; }
  command -v scoop &>/dev/null && { echo scoop; return; }
  echo none
}

bootstrap_detect_os() {
  SB_OS_KERNEL="$(uname -s 2>/dev/null || echo unknown)"
  SB_OS_FAMILY=unknown
  SB_OS_DISPLAY="$SB_OS_KERNEL"
  SB_PKG_MANAGER=none

  case "$SB_OS_KERNEL" in
    Darwin)
      SB_OS_FAMILY=darwin
      SB_OS_DISPLAY="macOS"
      bootstrap_init_brew_path
      command -v brew &>/dev/null && SB_PKG_MANAGER=brew
      ;;
    Linux)
      SB_OS_FAMILY=linux
      SB_OS_DISPLAY="Linux"
      SB_PKG_MANAGER="$(bootstrap_detect_linux_pkg)"
      if [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
        SB_OS_DISPLAY="Linux (WSL: ${WSL_DISTRO_NAME})"
      fi
      ;;
    FreeBSD)
      SB_OS_FAMILY=freebsd
      SB_OS_DISPLAY="FreeBSD"
      command -v pkg &>/dev/null && SB_PKG_MANAGER=pkg
      ;;
    OpenBSD)
      SB_OS_FAMILY=openbsd
      SB_OS_DISPLAY="OpenBSD"
      command -v pkg_add &>/dev/null && SB_PKG_MANAGER=pkg_add
      ;;
    MINGW*|MSYS*|CYGWIN*)
      SB_OS_FAMILY=windows
      SB_OS_DISPLAY="Windows (${SB_OS_KERNEL})"
      SB_PKG_MANAGER="$(bootstrap_detect_windows_pkg)"
      ;;
    *)
      SB_OS_FAMILY=unknown
      ;;
  esac

  export SB_OS_KERNEL SB_OS_FAMILY SB_OS_DISPLAY SB_PKG_MANAGER
}
