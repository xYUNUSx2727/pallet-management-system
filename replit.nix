{pkgs}: {
  deps = [
    pkgs.rustc
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.libiconv
    pkgs.cargo
    pkgs.mariadb
    pkgs.glibcLocales
    pkgs.freetype
    pkgs.openssl
    pkgs.postgresql
  ];
}
