
var context = createContext({});

context(['lodash', 'moment', 'server/sources/gocd/pipelineFeedReader', 'server/sources/gocd/gocdRequestor', 'server/sources/github/githubRequestor'], function(_, moment, thePipelineFeedReader, gocdRequestor, githubRequestor) {

  var NUM_ENTRIES_IN_FIXTURE = 12;

  beforeEach(function() {
    gocdRequestor.get = gocdRequestor.getSample;
    gocdRequestor.getStageDetails = gocdRequestor.getSampleStageDetails;
    gocdRequestor.getMaterialHtml = gocdRequestor.getSampleMaterialHtml;
    githubRequestor.getCommitStats = githubRequestor.getSampleCommitStats
  });

  describe('pipelineFeedReader', function () {
    beforeEach(function() {
      thePipelineFeedReader.clear();
    });

    describe('readHistory()', function () {

      it('should log an example to the console, for documentation purposes', function () {
        thePipelineFeedReader.readHistory(function (results) {
          var keys = _.keys(results);
          var dataToLog = {};
          results[keys[0]].stages = [ results[keys[0]].stages[0]];
          dataToLog[keys[0]] = results[keys[0]];

          console.log('SAMPLE HISTORY PARSED FROM go PIPELINE FEED', JSON.stringify(dataToLog, undefined, 2));
        });
      });

      it('should initialise a set of pipeline runs', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(_.keys(results).length).toBe(NUM_ENTRIES_IN_FIXTURE);
          expect(results['1199']).toBeDefined();
        });
      });

      it('should pass through a parameter for the callback', function () {
        thePipelineFeedReader.readHistory(function (results, parameter) {
          expect(parameter).toBe('aParameter');
        }, { callbackParameter: 'aParameter' });
      });

      it('should exclude pipelines if specified', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(_.keys(results).length).toBe(NUM_ENTRIES_IN_FIXTURE - 2);
        }, { exclude: ['1199', '1198'] });
      });

      it('should pass no url to the requestor in initial call', function () {
        spyOn(gocdRequestor, 'get');
        thePipelineFeedReader.readHistory(function (results, parameter) {
        });
        expect(gocdRequestor.get.mostRecentCall.args[0]).toBeUndefined();
      });

      it('should pass a next url to the requestor', function () {
        spyOn(gocdRequestor, 'get');
        thePipelineFeedReader.readHistory(function (results, parameter) {
        }, {
          callbackParameter: 'aParameter',
          nextUrl: 'nextUrl'
        });
        expect(gocdRequestor.get.mostRecentCall.args[0]).toBe('nextUrl');
      });

      it('should determine the time the last stage finished', function () {
        thePipelineFeedReader.readHistory(function (results) {
          var expectedTime = moment('2014-07-18T16:08:39+00:00');
          var actualTime = moment(results['1199'].time);
          expect(actualTime.hours()).toBe(expectedTime.hours());
          expect(actualTime.minutes()).toBe(expectedTime.minutes());
          expect(actualTime.seconds()).toBe(expectedTime.seconds());
        });
      });

      it('should determine the result of the pipeline', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].result).toBe('passed');
          expect(results['1195'].result).toBe('failed');
        });
      });

      it('should say a pipeline passed when a job was rerun and passed the second time', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1198'].result).toBe('passed');
        });
      });

      it('should determine the author of a job', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].result).toBe('passed');
          expect(results['1199'].author).toBeDefined();
          expect(results['1199'].author.name).toContain('Max Mustermann');
          expect(results['1195'].result).toBe('failed');
          expect(results['1195'].author.name).toContain('Max Mustermann');
        });
      });

      it('should parse committer and commit message from material HTML', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].materials.length).toBe(2);
          expect(results['1199'].materials[0].committer).toContain('Max Mustermann');
          expect(results['1199'].materials[0].comment).toContain('awesome');
          expect(results['1199'].materials[0].sha).toBe('074cc70d464ad708c82bc6316f6c21ee35cffdcf');
          expect(results['1199'].materials[1].sha).toBe('185cc70d464ad708c82bc6316f6c21ee35cffdcf');
        });
      });

      it('should get commit stats from github', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].materials.length).toBe(2);
          expect(results['1199'].materials[0].stats).toBeDefined();
        });
      });

      it('should not request material info again if already set in previous call', function () {
        spyOn(gocdRequestor, 'getMaterialHtml').andCallThrough();
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].materials).toBeDefined();
          expect(gocdRequestor.getMaterialHtml.callCount).toBe(NUM_ENTRIES_IN_FIXTURE);
          thePipelineFeedReader.readHistory(function (results) {
            expect(results['1199'].materials).toBeDefined();
            expect(gocdRequestor.getMaterialHtml.callCount).toBe(NUM_ENTRIES_IN_FIXTURE);
          });
        });

      });

      it('should put author and commit message into info text, if present', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].info).toContain('Mustermann');
          expect(results['1199'].info).toContain('second change');
        });
      });

      it('should create initials of person that authored changes for a failed job', function () {
        thePipelineFeedReader.readHistory(function (results) {
          expect(results['1199'].author.initials).toContain('mmu');
        });
      });

      xit('should create initials of person that broke the pipeline run', function () {
        // TODO: Rewrite this test to work here
        fakePipelineHistory = {
          '123': {
            wasSuccessful: notSuccessfulFn,
            time: mockTime,
            author: {
              name: 'Max Mustermann'
            }
          },
          '122': {
            wasSuccessful: notSuccessfulFn,
            time: mockTime,
            author: {
              name: 'Has Three Names'
            }
          },
          '121': {
            wasSuccessful: notSuccessfulFn,
            time: mockTime,
            author: {
              name: 'Special Cäracter'
            }
          }
        };

        haringGocdMapper.readHistoryAndActivity(function (result) {
          expect(result.figures[0].initials).toBe('mmu');
          expect(result.figures[1].initials).toBe('htn');
          expect(result.figures[2].initials).toBe('scx');
        });
      });

    });
  });
});