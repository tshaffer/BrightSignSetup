//
//  FirstViewController.swift
//  JTR
//
//  Created by Classroom Tech User on 2/10/15.
//  Copyright (c) 2015 Classroom Tech User. All rights reserved.
//

import UIKit

class HomeViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {

    @IBOutlet var homeTblView: UITableView!
    
    let menuItems = ["Recorded Shows2", "Record Now", "Manual Record", "To Do List"]
    let textCellIdentifier = ["toRecordedShows", "toRecordNow",  "toManualRecord", "toToDoList"]

    override func viewDidLoad() {
        super.viewDidLoad()
        
        homeTblView.delegate = self
        homeTblView.dataSource = self
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    
    
    func numberOfSectionsInTableView(tableView: UITableView) -> Int {
        return 1
    }
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return menuItems.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let row = indexPath.row
        let cell = tableView.dequeueReusableCellWithIdentifier(textCellIdentifier[row], forIndexPath: indexPath) as UITableViewCell
        cell.textLabel?.text = menuItems[row]
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        tableView.deselectRowAtIndexPath(indexPath, animated: true)
        
        let row = indexPath.row
    }
}

