{pkgs}: {
  deps = [
    pkgs.mariadb
    pkgs.glibcLocales
    pkgs.freetype
    pkgs.openssl
    pkgs.postgresql
  ];
}
