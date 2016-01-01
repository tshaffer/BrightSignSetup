/**
 * Created by tedshaffer on 12/28/15.
 */
Meteor.startup(function () {

    debugger;

    Recordings.before.remove(function (userId, doc) {
        debugger;
        console.log("Recordings.before.remove invoked");
        console.log("Delete file: " + doc.FileName);
        return true;
    });

    var url = "http://192.168.0.108:8080/getRecordings";

    // meteor's HTTP  - the code below works
    //debugger;
    //console.log("invoke getRecordings");
    //var url = "http://192.168.0.108:8080/getRecordings";
    //HTTP.call(
    //    'GET',
    //    url,
    //    { },
    //    function ( error, response ) {
    //        if (error) {
    //            console.log("error");
    //        }
    //        else {
    //            console.log(response);
    //        }
    //    }
    //);

    // using npm module 'request' worked with code below.
    // also see:
    ////      <root of webSite>/packages.json
    //var request = Npm.require("request");
    //request(url, function (error, response, body) {
    //    if (error) {
    //        console.log(error);
    //    }
    //    else if (response.statusCode == 200) {
    //        console.log(body);
    //    }
    //})

    var numStations = Stations.find().count();
    console.log("numStations is " + numStations.toString());
    if (numStations == 0) {
        var stations = [
            {
                'StationId': '19571',
                'AtscMajor': '2',
                'AtscMinor': '1',
                'CommonName': 'KTVU',
                'Name': 'KTVUDT (KTVU-DT)',
                'CallSign': ''
            },
            {
                'StationId': '19573',
                'AtscMajor': '4',
                'AtscMinor': '1',
                'CommonName': 'KRON',
                'Name': 'KRONDT (KRON-DT)',
                'CallSign': ''
            }
        ];

        for (var i = 0; i < stations.length; i++) {
            Stations.insert(stations[i]);
        }
    }

    if (Settings.find().count() === 0) {
        var settings = [
            {
                'RecordingBitRate': '19571',
                'SegmentRecordings': '2'
            }
        ];

        for (var i = 0; i < settings.length; i++) {
            Settings.insert(settings[i]);
        }
    }

    if (Recordings.find().count() == 0) {
        //var recordings = [
        //    {
        //        'RecordingId': ,
        //        'Title': '',
        //        'StartDateTime': '',
        //        'Duration': ,
        //        'FileName': '',
        //        'LastViewedPosition': ,
        //        'TranscodeComplete': ,
        //        'HLSSegmentationComplete: ,
        //        'HLSUrl': ''
        //    },
        //];

        var recordings = [

            {'RecordingId':1, 'Title':	"KPIX 5 News at 6pm", 'StartDateTime': "2015/10/12 18:43:08.493",'Duration':17, 'FileName':"20151012T184308", 'LastViewedPosition':532	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':3, 'Title':	"The Muppets", 'StartDateTime': "2015/10/13 20:00:02.020",'Duration':30, 'FileName':"20151013T200002", 'LastViewedPosition':306	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':4, 'Title':	"The Grinder", 'StartDateTime': "2015/10/13 20:30:02.027",'Duration':30, 'FileName':"20151013T203002", 'LastViewedPosition':1799	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':5, 'Title':	"NCIS: New Orleans", 'StartDateTime': "2015/10/13 21:00:02.015",'Duration':60, 'FileName':"20151013T210002", 'LastViewedPosition':3599	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':22, 'Title': "Modern Family", 'StartDateTime': "2015/10/22 18:57:31.071",'Duration':2, 'FileName':"20151022T185731", 'LastViewedPosition':73	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':52, 'Title': "The Big Bang Theory", 'StartDateTime': "2015/11/30 19:00:02.015",'Duration':30, 'FileName':"20151130T190002", 'LastViewedPosition':183	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':73, 'Title': "The Big Bang Theory", 'StartDateTime': "2015/12/06 18:30:02.012",'Duration':35, 'FileName':"20151206T183002", 'LastViewedPosition':1	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':74, 'Title': "Jeopardy!", 'StartDateTime': "2015/12/07 19:00:02.016",'Duration':30, 'FileName':"20151207T190002", 'LastViewedPosition':0	, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':105, 'Title': "Jack Hanna's Wild Countdown", 'StartDateTime': "2015/12/20 11:08:56.622",'Duration':14, 'FileName':"20151220T110856", 'LastViewedPosition':0,	'TranscodeComplete':"1", 'HLSSegmentationComplete':"1",	'HLSUrl':"/content/hls/20151220T110856/20151220T110856_index.m3u8"},
            {'RecordingId':106, 'Title': "Jack Hanna's Wild Countdown", 'StartDateTime': "2015/12/20 11:08:56.622",'Duration':24, 'FileName':"20151220T110856", 'LastViewedPosition':0,	'TranscodeComplete':"1", 'HLSSegmentationComplete':"1",'HLSUrl':"/content/hls/20151220T110856/20151220T110856_index.m3u8"},
            {'RecordingId':107, 'Title': "Dr. Seuss' How the Grinch Stole Christmas", 'StartDateTime': "2015/12/23 20:00:02.008",'Duration':35, 'FileName':"20151223T200002", 'LastViewedPosition':0, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':108, 'Title': "Adele Live in New York City", 'StartDateTime': "2015/12/23 21:00:02.007",'Duration':60, 'FileName':"20151223T210002", 'LastViewedPosition':0, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':116, 'Title': "Seinfeld", 'StartDateTime': "2015/12/27 00:00:03.664",'Duration':30, 'FileName':"20151227T000003", 'LastViewedPosition':0, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''},
            {'RecordingId':117, 'Title': "Seinfeld", 'StartDateTime': "2015/12/27 00:30:02.011",'Duration':30, 'FileName':"20151227T003002", 'LastViewedPosition':0, 'TranscodeComplete': 1, 'HLSSegmentationComplete': 0, 'HLSUrl': ''}
        ];

        for (var i = 0; i < recordings.length; i++) {
            Recordings.insert(recordings[i]);
        }
    }
});
