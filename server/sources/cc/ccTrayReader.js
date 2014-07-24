var _ = require('lodash');

var ccTrayReaderCreator = function (ccTrayRequestor) {

  var activity = [];

  var requestActivity = function (callback) {
    ccTrayRequestor.get(function(json) {
      json.Projects.Project = _.map(json.Projects.Project, function(entry) {
        return entry;
      });
      callback(json);
    });
  };

  var init = function() {
    requestActivity(function (result) {

      // Assumption (Go CD): Jobs are the ones with 3 path elements
      // 'PIPELINE-NAME :: stage-name :: job-name'
      _.each(result.Projects.Project, function(project) {
        var pathElements = project.name.split(' :: ');
        if (pathElements.length === 3) {
          activity.push(project);
        }
      });

    });
  };

  var readActivity = function(callback, callbackParameter) {
    callback(activity, callbackParameter);
  };

  init();

  return {
    readActivity: readActivity
  };
};

var ccTrayRequestorCreator = require('./ccTrayRequestor.js');
var ccTrayReader = ccTrayReaderCreator(ccTrayRequestorCreator.create());

exports.create = ccTrayReaderCreator;
exports.readActivity = ccTrayReader.readActivity;
