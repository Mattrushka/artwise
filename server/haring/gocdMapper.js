var _ = require('lodash');
var moment = require('moment');

function gocdMapperCreator(pipelineReader, ccTrayReader) {

  var colorsSuccess = [
    'dark-green',
    'blue',
    'dark-blue'
  ];

  var colorsFailure = [
    'red',
    'pink',
    'yellow'
  ];

  var readHistoryAndActivity = function(callWhenDone) {
    ccTrayReader.readActivity(function(activity) {
      var activityHaring = mapActivityDataToFigures(activity);

      pipelineReader.readHistory(function(history) {

        var historyHaring = mapPipelineDataToFigures(history);

        activityHaring.figures = activityHaring.figures.concat(historyHaring.figures);
        activityHaring.background = historyHaring.background;

        callWhenDone(activityHaring);

      }, { exclude: [ activity.buildNumberInProgress] } );

    })
  };

  var readHistory = function(callWhenDone, activeBuildNumber) {
    pipelineReader.readHistory(mapPipelineDataToFigures, { callbackParameter: callWhenDone, exclude: [ activeBuildNumber ] });
  };

  var readActivity = function(callWhenDone) {
    ccTrayReader.readActivity(mapActivityDataToFigures, { callbackParameter: callWhenDone });
  };

  function getFigureType(entry, lastEntryWasSuccessful) {

    if(entry.wasSuccessful() && !lastEntryWasSuccessful) {
      return 'flying';
    } else if (entry.wasSuccessful()) {
      return 'walking';
    } else if ( ! entry.wasSuccessful() && !lastEntryWasSuccessful) {
      return 'crawling';
    } else {
      return 'stumbling';
    }
  }

  function getColor(entry) {
    if(entry.wasSuccessful()) {
      return 'COLD';
    } else {
      return 'WARM';
    }
  }

  function getInitialsOfBreaker(entry) {

    function onlyAtoZ(character) {
      var isLetter = character.toLowerCase() >= "a" && character.toLowerCase() <= "z";
      if (! isLetter) {
        return 'x';
      } else {
        return character;
      }
    }

    if(entry.breaker !== undefined && entry.breaker.name !== undefined) {
      var nameParts = entry.breaker.name.split(' ');

      var initials = _.map(nameParts, function(namePart, index) {
        if (index !== nameParts.length - 1) {
          return onlyAtoZ(namePart[0]);
        } else {
          return onlyAtoZ(namePart[0]) + onlyAtoZ(namePart[1]);
        }
      }).join('');

      return initials.toLowerCase().substr(0, 3);
    }
  }

  function compareNumbers(a, b) {
    // JS does lexicographical sorting by default, need to sort by number
    return a - b;
  }

  function mapPipelineDataToFigures(history, callWhenDone) {

    function getChangesByInfo(historyEntry) {
      return 'changes by ' + (historyEntry.breaker ? historyEntry.breaker.name : 'UNKNOWN');
    }

    function getInfo(historyEntry, buildNumber) {
      var theTime = moment(historyEntry.time).format('MMMM Do YYYY, h:mm:ss a');
      var theResult = historyEntry.wasSuccessful() ? 'Success' : historyEntry.stageFailed + ' | ' + getChangesByInfo(historyEntry);
      return '[' + buildNumber + '] ' + theTime + ' | ' + theResult;
    }

    var keysDescending = _.keys(history).sort(compareNumbers).reverse();
    var figures = _.map(keysDescending, function(key, index) {

      var entry = history[key];
      var previous = index < keysDescending.length ? history[keysDescending[index + 1]] : undefined;

      return {
        color: getColor(entry),
        info: getInfo(entry, key),
        type: getFigureType(entry, previous ? previous.wasSuccessful() : true),
        initials: getInitialsOfBreaker(entry)
      };
    });

    var lastBuildSuccessful = history[keysDescending[0]].wasSuccessful();

    var changesExist = true;
    var result = {
      background: lastBuildSuccessful ? 'green' : 'orange',
      figures: figures
    };

    if(callWhenDone) {
      callWhenDone(result, changesExist);
    } else {
      return result;
    }

  }

  function mapActivityDataToFigures(activity, callWhenDone) {

    function getFigureTypeForActivity(entry) {

      if(entry.activity === 'Building') {
        return 'skating';
      } else {
        return getFigureType(entry, true);
      }
    }

    function getColor(entry) {
      if(entry.lastBuildStatus === 'Success') {
        return 'COLD';
      } else if (entry.lastBuildStatus === 'Failure') {
        return 'WARM';
      } else {
        return 'grey';
      }
    }

    function getInfo(entry) {
      if(entry.activity === 'Building') {
        return entry.name + ' is building';
      } else {
        var info = entry.name + ' | ' + entry.lastBuildStatus;
        if(!entry.wasSuccessful() && entry.breaker) {
          info += ' | changes by ' + entry.breaker.name;
        }
        return info;
      }
    }

    var figures = _.map(activity.jobs, function(entry) {
      return {
        color: getColor(entry),
        info: getInfo(entry),
        type: getFigureTypeForActivity(entry),
        border: 'dotted',
        initials: getInitialsOfBreaker(entry)
      }
    });

    var changesExist = true;
    if(callWhenDone) {
      callWhenDone({ figures: figures }, changesExist);
    } else {
      return { figures: figures };
    }

  }

  return {
    readHistory: readHistory,
    readActivity: readActivity,
    readHistoryAndActivity: readHistoryAndActivity
  }
}


var pipelineReader = require('../sources/gocd/pipelineFeedReader.js');
var ccTrayReader = require('../sources/cc/ccTrayReader.js');
var gocdMapper = gocdMapperCreator(pipelineReader, ccTrayReader);

exports.create = gocdMapperCreator;
exports.readHistory = gocdMapper.readHistory;
exports.readActivity = gocdMapper.readActivity;
exports.readHistoryAndActivity = gocdMapper.readHistoryAndActivity;
