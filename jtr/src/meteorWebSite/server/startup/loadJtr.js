/**
 * Created by tedshaffer on 12/28/15.
 */
Meteor.startup(function () {
    if (Stations.find().count() === 0) {
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

});
