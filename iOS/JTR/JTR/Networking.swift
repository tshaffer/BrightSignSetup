//
//  Networking.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import Foundation

class Networking {
    var baseUrl : String?
    
    init() {
        
    }
    
    init(_ base : String) {
        baseUrl = base
    }
    
    func executeCommand(cmd: String) {
        println("trying to execute command: \(cmd)")
        if let baseUrl = baseUrl {
            if let url = NSURL(string: (baseUrl + cmd)) {
                let urlRequest = NSURLRequest(URL: url);
                NSURLConnection.sendAsynchronousRequest(urlRequest, queue: NSOperationQueue.mainQueue(), completionHandler:
                    {(resp: NSURLResponse!, data: NSData!, error: NSError!) -> Void
                        in
                        //this is the "done" callback
                        
                })
            }
        }
    }
    
    func deleteShow(recordingId: String) {
        //make a JSON object {recordingId : "<id>"} and send that
        
        if let baseUrl = baseUrl {
            if let url = NSURL(string: (baseUrl + "deleteRecording")) {
                let urlRequest = NSURLRequest(URL: url);
                NSURLConnection.sendAsynchronousRequest(urlRequest, queue: NSOperationQueue.mainQueue(), completionHandler:
                    {(resp: NSURLResponse!, data: NSData!, error: NSError!) -> Void
                        in
                        //this is the "done" callback
                })
            }
        }
    }
    
    func getCurrentState() {
        if let baseUrl = baseUrl {
            if let url = NSURL(string: (baseUrl + "currentState")) {
                let urlRequest = NSURLRequest(URL: url);
                NSURLConnection.sendAsynchronousRequest(urlRequest, queue: NSOperationQueue.mainQueue(), completionHandler:
                    {(resp: NSURLResponse!, data: NSData!, error: NSError!) -> Void
                        in
                        //this is the "done" callback
                        
                        //should return an object with a state field, title, duration, recordingId, date recorded, position
                })
            }
        }
    }
    
    func checkConnection() -> Bool {
        //randomly using the recordings end-point to check if the device is alive, should update later
        
        var didWork = false
        if let baseUrl = baseUrl {
            if let url = NSURL(string: (baseUrl + "recordings")) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                let json = JSON(data: responseData)
                if json != nil {
                    didWork = true
                }
            }
        }
        return didWork
    }
    
    //192.168.1.24
    
    func getRecordedShows() -> RecordedShows {
        var shows = RecordedShows()
        if let baseUrl = baseUrl {
            if let url = NSURL(string: (baseUrl + "recordings")) {
                let urlRequest = NSURLRequest(URL: url);
                var responseData: NSData = NSURLConnection.sendSynchronousRequest(urlRequest, returningResponse: nil, error: nil)!
                let json = JSON(data: responseData)
                
                //print("\(json)")
                
                
                for (index, show) in json["recordings"] {
                    let recordedShow = RecordedShow()
                    recordedShow.recordingId = show["RecordingId"].stringValue
                    recordedShow.title = show["Title"].stringValue
                    recordedShow.dateRecorded = show["StartDateTime"].stringValue
                    recordedShow.duration = show["Duration"].stringValue
                    recordedShow.transcodeComplete = show["TranscodeComplete"].stringValue
                    recordedShow.position = show["LastViewedPosition"].stringValue
                    
                    shows.recordedShows.append(recordedShow)
                }
            }
        }
        return shows
    }
    
}