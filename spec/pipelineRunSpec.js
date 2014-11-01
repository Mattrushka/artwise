var context = createContext({});

context(['moment', 'server/sources/gocd/pipelineRun'], function (moment, pipelineRunCreator) {

  describe('historyEntryCreator', function () {
    it('should create initials of person that broke the pipeline run', function (done) {
      pipelineRunCreator.createNew({author: {
        name: 'Special Cäracter'
      }}).promiseInitialise().then(function (result) {
        expect(result.stages[0].author.initials).toBe('scx');
      });
      pipelineRunCreator.createNew({author: {
        name: 'Has Three Names'
      }}).promiseInitialise().then(function (result) {
        expect(result.stages[0].author.initials).toBe('htn');
      });
      pipelineRunCreator.createNew({author: {
        name: 'Max Mustermann'
      }}).promiseInitialise().then(function (result) {
        expect(result.stages[0].author.initials).toBe('mmu');
      });

      done();
    });
  });

  describe('addStage()', function() {
    it('should add a new stage and recalculate results', function () {

      var firstStage = {
        updated: '2014-07-18T16:08:39+00:00',
        pipeline: 'A-PIPELINE',
        buildNumber: '1199',
        result: 'passed',
        "author": {
          "name": "Max Mustermann",
          "email": "<mmustermann@internet.se>",
          "initials": "mmu"
        }
      };
      var secondStage = {
        updated: '2014-07-18T17:08:39+00:00',
        pipeline: 'A-PIPELINE',
        buildNumber: '1199',
        result: 'failed',
        "author": {
          "name": "Max Mustermann",
          "email": "<mmustermann@internet.se>",
          "initials": "mmu"
        }
      };

      var pipelineRun = pipelineRunCreator.createNew(firstStage);
      pipelineRun.promiseInitialise();

      expect(pipelineRun.wasSuccessful()).toBe(true);
      var expectedTime = moment('2014-07-18T16:08:39+00:00');
      var actualTime = moment(pipelineRun.time);
      expect(actualTime.hours()).toBe(expectedTime.hours());

      pipelineRun.addStage(secondStage);
      expect(pipelineRun.wasSuccessful()).toBe(false);

      expectedTime = moment('2014-07-18T17:08:39+00:00');
      actualTime = moment(pipelineRun.time);
      expect(actualTime.hours()).toBe(expectedTime.hours());

    });
  });

});