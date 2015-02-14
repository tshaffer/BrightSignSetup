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
    
    
    func executeCommand(cmd: String) {
        if let baseUrl = baseUrl{
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
    
    
}