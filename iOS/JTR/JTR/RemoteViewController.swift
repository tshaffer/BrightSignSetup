//
//  RemoteViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/13/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class RemoteViewController: UIViewController {
    var network = Networking()
    
    @IBAction func homeBtn(sender: AnyObject) {
//        network.executeCommand("home")
        //should show main menu (and clear the background?)
    }
    
    @IBAction func sortAlphaBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func sortChronoBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func playBtn(sender: AnyObject) {
        network.executeCommand("play")
    }
    
    @IBAction func pauseBtn(sender: AnyObject) {
        network.executeCommand("pause")
    }
    
    @IBAction func rewindBtn(sender: AnyObject) {
        network.executeCommand("rewind")
    }
    
    @IBAction func instantReplayBtn(sender: AnyObject) {
        network.executeCommand("instantReplay")
    }
    
    @IBAction func stopBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func quickSkipBtn(sender: AnyObject) {
        network.executeCommand("quickSkip")
    }
    
    @IBAction func fastForwardBtn(sender: AnyObject) {
        network.executeCommand("fastForward")
    }
    
    @IBAction func muteBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func volumeDownBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func volumeUpBtn(sender: AnyObject) {
//        network.executeCommand("home")
    }
    
    @IBAction func deleteBtn(sender: AnyObject) {
        //need to get recordingId from the now playing
        var recordingId : String = "";
        network.deleteShow(recordingId)
    }
    
    
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
