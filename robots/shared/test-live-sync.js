(function () {
  "use strict";

  if (window.ONCUVATE_PUBLIC_TEST !== true) return;

  var brokerUrl = "wss://broker.emqx.io:8084/mqtt";
  var client = null;
  var connected = false;
  var pendingPublishes = [];
  var subscriptions = [];
  var progressByRoom = {};

  function randomId() {
    var values = new Uint32Array(2);
    window.crypto.getRandomValues(values);
    return "oncu-robots-" + values[0].toString(36) + values[1].toString(36);
  }

  function roomCode() {
    var sessionRoom = window.OcSession && window.OcSession.roomCode;
    if (sessionRoom) return String(sessionRoom).replace(/\D/g, "").slice(0, 5);
    var params = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    return String(params.get("room") || "").replace(/\D/g, "").slice(0, 5);
  }

  function lessonKey() {
    return document.documentElement.dataset.lessonId || "PB-ROBOTS-005";
  }

  function topicRoot() {
    return ["oncuvate", "public-test", lessonKey(), roomCode()].join("/");
  }

  function ensureClient() {
    if (client || !window.mqtt) return client;
    client = window.mqtt.connect(brokerUrl, {
      clientId: randomId(),
      clean: true,
      reconnectPeriod: 2500,
      connectTimeout: 9000
    });
    client.on("connect", function () {
      connected = true;
      subscriptions.forEach(function (subscription) {
        client.subscribe(subscription.topic, { qos: 0 });
      });
      while (pendingPublishes.length) {
        var pending = pendingPublishes.shift();
        client.publish(pending.topic, pending.payload, pending.options);
      }
    });
    client.on("close", function () { connected = false; });
    client.on("error", function () { connected = false; });
    client.on("message", function (topic, buffer) {
      var parsed;
      try { parsed = JSON.parse(buffer.toString()); } catch (_) { return; }
      subscriptions.forEach(function (subscription) {
        if (subscription.kind === "children") {
          var prefix = subscription.path + "/";
          if (topic.indexOf(prefix) !== 0) return;
          var childId = topic.slice(prefix.length).split("/")[0];
          var cacheKey = subscription.path;
          progressByRoom[cacheKey] = progressByRoom[cacheKey] || {};
          if (parsed === null) delete progressByRoom[cacheKey][childId];
          else progressByRoom[cacheKey][childId] = parsed;
          subscription.callback(Object.assign({}, progressByRoom[cacheKey]));
          return;
        }
        if (topic === subscription.path) subscription.callback(parsed);
      });
    });
    return client;
  }

  function publish(topic, value, retain) {
    var mqttClient = ensureClient();
    if (!mqttClient) return;
    var item = {
      topic: topic,
      payload: JSON.stringify(value),
      options: { qos: 0, retain: !!retain }
    };
    if (connected) mqttClient.publish(item.topic, item.payload, item.options);
    else pendingPublishes.push(item);
  }

  window.pth = function (scope) {
    return topicRoot() + "/" + String(scope || "").replace(/^\/+|\/+$/g, "");
  };

  window._set = function (path, value) {
    publish(path, value, /\/nav$/.test(path));
  };

  window._remove = function (path) {
    publish(path, null, true);
  };

  window._onValue = function (path, callback) {
    var isChildren = /\/prog$/.test(path);
    var subscription = {
      path: path,
      topic: isChildren ? path + "/+" : path,
      kind: isChildren ? "children" : "value",
      callback: callback
    };
    subscriptions.push(subscription);
    var mqttClient = ensureClient();
    if (mqttClient && connected) mqttClient.subscribe(subscription.topic, { qos: 0 });
    return function () {
      var index = subscriptions.indexOf(subscription);
      if (index >= 0) subscriptions.splice(index, 1);
      if (client && connected) client.unsubscribe(subscription.topic);
    };
  };

  window._onDisconnect = function () {
    return { remove: function () {} };
  };
})();
