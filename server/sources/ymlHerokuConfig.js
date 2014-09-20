
define(['xml2json', 'module', 'path', 'node-yaml-config', 'lodash'], function (xml2json, module, path, yaml_config, _) {

  var HEROKU_VARS_SUPPORT = [
    'user', 'password', 'url', 'pipeline', 'jobs', 'token', 'repo', 'key', 'secret', 'account'
  ];

  var create = function (configKey) {

    var config;
    var id = configKey;

    init();

    var get = function () {
      return config[id];
    };

    function init() {

      try {
        config = yaml_config.load('config.yml');
      } catch (err) {
        console.log('could not read yml, trying Heroku vars', err);

        config = {};
        config[id] = {};
        _.each(HEROKU_VARS_SUPPORT, function(varName) {
          config[id][varName] = process.env[id.toUpperCase() + '_' + varName.toUpperCase()];
        });

        if(config[id].jobs) {
          config[id].jobs = config[id].jobs.split(',');
        }

        if (!config[id].user || !config[id].password || !config[id].url) {
          console.log('ERROR: Not enough values in ' + id + ' config, cannot get data');
        }

      }

      config[id] = config[id] || { sample: true };
      config[id].sampleIt = function () {
        return config[id] === {} || config[id].sample === true;
      };

      config[id].loggableUrl = addCredentialsToUrlInternal(config[id].url, 'user', 'password');
      config[id].url = addCredentialsToUrl(config[id].url);

    }

    function addCredentialsToUrl(url) {
      return addCredentialsToUrlInternal(url, config[id].user, config[id].password);
    }

    function addCredentialsToUrlInternal(url, user, password) {
      if (user && password && !config[id].sampleIt()) {
        var urlNoHttp = url.indexOf('http') === 0 ? url.substr('http://'.length) : url;
        return 'http://' + user + ':' + password + '@' + urlNoHttp;
      } else {
        return url;
      }
    }

    return {
      get: get,
      addCredentialsToUrl: addCredentialsToUrl
    };
  };

  return {
    create: create
  };
});

