var _ = require('lodash');
var gocdReader = require('../gocdReader');

function miroGocdMapperConstellationModule() {

  function mapSize(entry) {

    if(entry['build_cause']) {
      var numberOfModifications = entry['build_cause'].files ? entry['build_cause'].files.length : 0;
      if(numberOfModifications <= 3) {
        return 'small';
      } else if(numberOfModifications <= 6) {
        return 'medium';
      } else {
        return 'large';
      }
    }
  }

  var readHistoryAndActivity = function() {
    return gocdReader.readData().then(function(data) {

      var history = data.history;

      var keysDescending = _.keys(history).sort(function(a, b) {
        return a - b; // JS does lexicographical sorting by default, need to sort by number
      }).reverse();
      var lastBuild = history[keysDescending[0]];

      var finalShapes = {};

      finalShapes.stroke = {
        color: lastBuild.wasSuccessful() ? 'black' : 'red',
        info: lastBuild.info
      };

      finalShapes.history = _.map(keysDescending.splice(1), function(key) {
        var entry = history[key];

        var size = mapSize(entry);
        return {
          size: size,
          color: entry.wasSuccessful() ? 'green' : 'red',
          info: entry.info + ' ' + (entry['build_cause'].files ? entry['build_cause'].files.length + ' changes' : 'no changes')
        };
      });

      return finalShapes;

    });
  };

  return {
    readHistoryAndActivity: readHistoryAndActivity
  }
}

exports.readHistoryAndActivity = miroGocdMapperConstellationModule().readHistoryAndActivity;