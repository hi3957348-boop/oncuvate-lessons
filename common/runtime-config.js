(function () {
  "use strict";

  if (window.ONCUVATE_API_BASE) return;
  if (location.hostname === "oncuvate.github.io") {
    window.ONCUVATE_API_BASE = "https://asia-northeast3-oncuvate-lessons-test.cloudfunctions.net/api";
  }
})();
