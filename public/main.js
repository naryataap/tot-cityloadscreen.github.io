(function () {
  var $ = function (id) { return document.getElementById(id); };

  // ---------- масштаб S = clamp(ScrH / 1080, 0.75, 1.6) ----------
  function scale() {
    var h = window.innerHeight || document.documentElement.clientHeight || 1080;
    $("panel").style.zoom = Math.max(0.75, Math.min(1.6, h / 1080));
  }
  scale();
  window.onresize = scale;

  // ---------- данные из адреса (sv_loadingurl "...?map=%m&steamid=%s") ----------
  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }
  function setText(id, v) { if (v !== undefined && v !== null && v !== "") $(id).innerHTML = String(v).replace(/</g, "&lt;"); }

  setText("map", param("map"));
  setText("steamid", param("steamid"));
  if (CONFIG.maxPlayers) setText("players", "до " + CONFIG.maxPlayers);

  // ---------- прогресс ----------
  var total = 0, needed = 0, shown = 0, floor = 0;

  function setProgress(p) {
    p = Math.max(shown, Math.min(100, Math.round(p)));
    shown = p;
    $("fill").style.width = p + "%";
    $("percent").innerHTML = p + "%";
  }

  function fromFiles() {
    if (total > 0) setProgress(floor + (90 - floor) * ((total - needed) / total));
  }

  // Порядок этапов загрузки GMod — для плавного ползунка без файлов
  var stages = [
    [/workshop/i, 20],
    [/retrieving|server info/i, 10],
    [/lua|addon/i, 70],
    [/client info|sending/i, 95],
    [/starting|complete|parsing/i, 85]
  ];

  // Статусы GMod приходят по-английски — переводим известные
  var ru = [
    [/^retrieving server info.*/i, "Получение данных сервера…"],
    [/^sending client info.*/i, "Отправка данных клиента…"],
    [/^client info sent.*/i, "Данные клиента отправлены"],
    [/^workshop complete.*/i, "Мастерская загружена"],
    [/^downloading (\d+) workshop addons?.*/i, "Загрузка аддонов Мастерской: $1"],
    [/^downloading (.*)/i, "Загрузка: $1"],
    [/^mounting addons?.*/i, "Подключение аддонов…"],
    [/^received (\d+) ?\/ ?(\d+) lua files.*/i, "Получено Lua-файлов: $1 / $2"],
    [/^received lua files.*/i, "Lua-файлы получены"],
    [/^starting lua.*/i, "Запуск Lua…"],
    [/^parsing game info.*/i, "Чтение данных игры…"],
    [/^loading (.*)/i, "Загрузка: $1"],
    [/^precaching.*/i, "Подготовка ресурсов…"],
    [/^initializing.*/i, "Инициализация…"],
    [/^connecting.*/i, "Подключение…"]
  ];
  function translate(t) {
    t = String(t);
    for (var i = 0; i < ru.length; i++) {
      if (ru[i][0].test(t)) return t.replace(ru[i][0], ru[i][1]);
    }
    return t;
  }

  // ---------- функции, которые вызывает Garry's Mod ----------
  window.GameDetails = function (servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    setText("server", servername);
    setText("map", mapname);
    setText("gamemode", gamemode);
    if (maxplayers) setText("players", "до " + maxplayers);
    setText("steamid", steamid);
  };

  window.SetFilesTotal = function (n) { total = n; fromFiles(); };
  window.SetFilesNeeded = function (n) { needed = n; fromFiles(); };

  window.DownloadingFile = function (name) {
    setText("file", name);
    needed = Math.max(0, needed - 1);
    fromFiles();
  };

  window.SetStatusChanged = function (status) {
    setText("status", translate(status));
    for (var i = 0; i < stages.length; i++) {
      if (stages[i][0].test(status)) {
        floor = Math.max(floor, stages[i][1]);
        setProgress(stages[i][1]);
        break;
      }
    }
  };

  // ---------- фоновые фото ----------
  var list = CONFIG.backgrounds || [];
  var slides = [$("slideA"), $("slideB")], cur = 0, idx = 0;

  function src(file) {
    if (/^https?:/.test(file)) return file;
    return "/.netlify/images?url=/img/" + encodeURIComponent(file) + "&w=1920&q=80";
  }

  function show(i) {
    var img = new Image();
    img.onload = function () {
      var next = slides[1 - cur];
      next.style.backgroundImage = "url('" + img.src + "')";
      next.className = "slide on";
      slides[cur].className = "slide";
      cur = 1 - cur;
    };
    img.src = src(list[i]);
  }

  if (list.length) {
    show(0);
    if (list.length > 1) {
      setInterval(function () { idx = (idx + 1) % list.length; show(idx); }, (CONFIG.slideSeconds || 7) * 1000);
    }
  }
})();