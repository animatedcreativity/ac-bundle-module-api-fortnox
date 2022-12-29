exports = module.exports = exports = module.exports = function() {
  var mod = {
    headers: function(headers) {
      if (typeof headers === "undefined") headers = {};
      headers["Access-Token"] = config.fortnox.accessToken;
      headers["Client-Secret"] = config.fortnox.clientSecret;
      headers["Content-Type"] = "application/json";
      headers["Accept"] = "application/json";
      return headers;
    },
    requestCallback: async function(callback, errorCallback, url, method, data, page, retry) {
      if (!app.has(page)) page = 1;
      if (!app.has(method)) method = "GET";
      if (!app.has(retry)) retry = 0;
      var fetchUrl = config.fortnox.endpoint + url + (url.split("?").length <= 1 ? "?" : "&") + "page=" + page + "&limit=500&sortorder=descending";
      if (config.api.log.url === true) console.log(retry, method, fetchUrl);
      var options = {
        method: method,
        headers: app.api.fortnox.headers()
      };
      if (app.has(data) === true) options.body = JSON.stringify(data);
      var result = await app.fetch(fetchUrl, options);
      if (result.status === 200) {
        var json = await result.json();
        if (typeof callback === "function") {
          var cResult = await callback(json, page);
          if (app.has(json.MetaInformation) === true && app.has(cResult) && app.has(cResult.length)) {
            console.log("(" + json.MetaInformation["@CurrentPage"] + "/" + json.MetaInformation["@TotalPages"] + ") done.");
            if (json.MetaInformation["@CurrentPage"] < json.MetaInformation["@TotalPages"]) {
              await mod.requestCallback(callback, errorCallback, url, method, data, json.MetaInformation["@CurrentPage"] + 1);
            }
          }
        }
      } else {
        if (method === "DELETE" && result.status === 204) {
          if (typeof callback === "function") {
            var cResult = await callback({deleted: true}, page);
          }
        } else {
          if (result.status === 429) {
            await mod.requestCallback(callback, errorCallback, url, method, data, page, retry + 1);
          } else {
            if (typeof errorCallback === "function") errorCallback("Could not load " + url + " from fortnox.", await result.text());
          }
        }
      }
    }
  };
  return mod;
};