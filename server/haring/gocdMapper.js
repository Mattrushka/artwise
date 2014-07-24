var _ = require('lodash');
var moment = require('moment');

function gocdMapperCreator(pipelineReader, ccTrayReader) {

  var colorsSuccess = [
    'dark-green',
    'blue',
    'dark-blue'
  ];

  var colorsFailure = [
    'orange',
    'pink',
    'yellow'
  ];

  var readHistory = function(callWhenDone) {
    pipelineReader.readHistory(mapPipelineDataToFigures, callWhenDone);
  };

  var readActivity = function(callWhenDone) {
    ccTrayReader.readActivity(mapActivityDataToFigures, callWhenDone);
  };

  var trueFn = function() { return true; };

  function mapPipelineDataToFigures(history, callWhenDone) {

    function getInfo(historyEntry) {
      var theTime = moment(historyEntry.time).format('MMMM Do YYYY, h:mm:ss a');
      var theResult = historyEntry.wasSuccessful() ? 'Success' : 'Stage failed: ' + historyEntry.stageFailed;
      return theTime + ' ' + theResult;
    }

    function getFigureType(entry, lastEntry) {

      lastEntry = lastEntry || { wasSuccessful: trueFn };

      if(entry.wasSuccessful() && !lastEntry.wasSuccessful()) {
        return 'flying';
      } else if (entry.wasSuccessful()) {
        return 'walking';
      } else if ( ! entry.wasSuccessful() && !lastEntry.wasSuccessful()) {
        return 'crawling';
      } else {
        return 'stumbling';
      }
    }

    function getColor(historyEntry) {
      if(historyEntry.wasSuccessful()) {
        return colorsSuccess[Math.floor(Math.random()*colorsSuccess.length)];
      } else {
        return colorsFailure[Math.floor(Math.random()*colorsFailure.length)];
      }
    }

    var keysDescending = _.keys(history).sort().reverse();
    var figures = _.map(keysDescending, function(key, index) {
      var entry = history[key];
      var previous = index < keysDescending.length ? history[keysDescending[index + 1]] : undefined;

      return {
        color: getColor(entry),
        column: index + 1,
        info: getInfo(entry),
        type: getFigureType(entry, previous)
      };
    });

    var lastBuildSuccessful = history[keysDescending[0]].wasSuccessful();

    var changesExist = true;
    callWhenDone({
      background: lastBuildSuccessful ? 'green' : 'orange',
      figures: figures
    }, changesExist);
  }

  function mapActivityDataToFigures(activity, callWhenDone) {

    function getFigureType(entry) {

      if(entry.activity === 'Building') {
        return 'skating';
      } else {
        return 'dog';
      }
    }

    var figures = _.map(activity, function(entry, index) {
      return {
        color: 'green',
        column: index + 1,
        info: 'This is some info',
        type: getFigureType(entry)
      }
    });

    var changesExist = true;
    callWhenDone(figures, changesExist);
  }

  return {
    readHistory: readHistory,
    readActivity: readActivity
  }
}


var pipelineReader = require('../sources/gocd/pipelineFeedReader.js');
var ccTrayReader = require('../sources/cc/ccTrayReader.js');
var gocdMapper = gocdMapperCreator(pipelineReader, ccTrayReader);

exports.create = gocdMapperCreator;
exports.readHistory = gocdMapper.readHistory;
exports.readActivity = gocdMapper.readActivity;
