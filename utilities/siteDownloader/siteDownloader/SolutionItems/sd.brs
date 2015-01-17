Sub Main()

    print "Launch SiteDownloader"
    
    RunSiteDownloader()

End Sub


Sub RunSiteDownloader()

    SiteDownloader = newSiteDownloader()
    
    SiteDownloader.msgPort = CreateObject("roMessagePort")
    
    SiteDownloader.gpioPort = CreateObject("roGpioControlPort")
    SiteDownloader.gpioPort.SetPort(SiteDownloader.msgPort)

    credentials = invalid
    
    SiteDownloader.localServer = CreateObject("roHttpServer", { port: 8080 })
    SiteDownloader.localServer.SetPort(SiteDownloader.msgPort)
    
    SiteDownloader.FilePostedAA = { HandleEvent: FilePosted, mVar: SiteDownloader }
    SiteDownloader.localServer.AddPostToFile({ url_path: "/UploadFile", destination_directory: GetDefaultDrive(), user_data: SiteDownloader.FilePostedAA, passwords: credentials })

    SiteDownloader.GetFilesToTransferAA =  { HandleEvent: GetFilesToTransfer, mVar: SiteDownloader }
    SiteDownloader.localServer.AddPostToFile({ url_path: "/GetFilesToTransfer", destination_directory: GetDefaultDrive(), user_data: SiteDownloader.GetFilesToTransferAA })

    SiteDownloader.ExitScriptAA = { HandleEvent: ExitScript, mVar: SiteDownloader }
    SiteDownloader.localServer.AddGetFromEvent({ url_path: "/ExitScript", user_data: SiteDownloader.ExitScriptAA })

    SiteDownloader.EventLoop()
    

End Sub


Function newSiteDownloader() As Object

    SiteDownloader = CreateObject("roAssociativeArray")

    SiteDownloader.EventLoop = EventLoop
	SiteDownloader.FilePosted = FilePosted
    SiteDownloader.ExitScript = ExitScript

    return SiteDownloader
    
End Function


Sub EventLoop()

    while true
        
        msg = wait(0, m.msgPort)

        if type(msg) = "roHttpEvent" then
        
            userdata = msg.GetUserData()
            userData.HandleEvent(userData, msg)
                                     
        else if type(msg) = "roGpioButton" then

            if msg.GetInt()=12 then
                m.localServer = invalid
                stop
            endif

        endif
        
    end while
    
End Sub


Sub ExitScript(userData as Object, e as Object)

    print "respond to ExitScript request"
    
    e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

    mVar = userData.mVar
    mVar.localServer = invalid

    print "exit the program"
    end
        
End Sub


Function GetFilesToTransfer(userData as Object, e as Object)

    mVar = userData.mVar
    
    print "respond to GetFilesToTransfer request"

    MoveFile(e.GetRequestBodyFile(), "filesInSite.xml")
    
	filesToTransfer = GetDifferentOrMissingFiles()

	xml = PopulateFilesToTransfer(filesToTransfer)

	if xml = invalid then
		e.SendResponse(404)
	else
		e.SetResponseBodyString(xml)
		e.SendResponse(200)
	endif

End Function


Sub FilePosted(userData as Object, e as Object)

    mVar = userData.mVar

	destinationFilename = e.GetRequestHeader("Destination-Filename")
    print "FilePosted to ";destinationFileName
	ok = MoveFile(e.GetRequestBodyFile(), destinationFilename)
	if not ok then
		regex = CreateObject("roRegEx","\\","i")
		parts = regex.Split(destinationFilename)
		if parts.Count() > 1 then
			dirName$ = ""
			for i% = 0 to (parts.Count() - 2)
				dirName$ = dirName$ + parts[i%] + "\"

				' check to see if directory already exits
				dir = CreateObject("roReadFile", dirName$)
				if type(dir) <> "roReadFile" then
					ok = CreateDirectory(dirName$)
					if not ok then
						stop
					endif
				endif
			next

			' directories have been created - try again
			ok = MoveFile(e.GetRequestBodyFile(), destinationFilename)

		endif
	endif

	if not ok then
		stop
	endif

	e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

End Sub


Function PopulateFilesToTransfer(filesToTransfer As Object)

	xml = invalid

	if filesToTransfer.Count() > 0 then

        root = CreateObject("roXMLElement")
        
        root.SetName("filesToTransfer")

		for each fileToTransfer in filesToTransfer

            item = root.AddBodyElement()
            item.SetName("file")

            elem = item.AddElement("fileName")
            elem.SetBody(fileToTransfer.fileName)
        
            elem = item.AddElement("filePath")
            elem.SetBody(fileToTransfer.filePath)
        
            elem = item.AddElement("hashValue")
            elem.SetBody(fileToTransfer.hashValue)
        
            elem = item.AddElement("fileSize")
            elem.SetBody(stri(fileToTransfer.fileSize%))
		next

		xml = root.GenXML({ header: true })

    endif

	return xml

End Function


Function GetDifferentOrMissingFiles() As Object

    filesInSite$ = ReadAsciiFile("filesInSite.xml")
    if filesInSite$ = "" then stop

    filesInSiteXML = CreateObject("roXMLElement")
    filesInSiteXML.Parse(filesInSite$)

    filesToTransfer = []
    
    for each fileXML in filesInSiteXML.file

		fileInSite = {}
		fileInSite.fileName = fileXML.fileName.GetText()
		fileInSite.filePath = fileXML.filePath.GetText()
		fileInSite.hashValue = fileXML.hashValue.GetText()
		fileInSite.fileSize% = int(val(fileXML.fileSize.GetText()))

		fileOnCardIdentical = false

		file = CreateObject("roReadFile", fileInSite.filePath)
		if type(file) = "roReadFile" then
			file.SeekToEnd()
			size% = file.CurrentPosition()
			if size% > 0 then
				' file exists on card and is non zero size - see if it is the same file
				if size% = fileInSite.fileSize% then

					' size is identical, check sha1
'					fileInSiteContents$ = ReadAsciiFile(fileInSite.filePath)
'					hashGen = CreateObject("roHashGenerator", "SHA1")
'					sha1 = hashGen.hash(fileInSiteContents$).ToHexString()
					sha1 = GetSHA1(fileInSite.filePath)

					if lcase(sha1) = lcase(fileInSite.hashValue) then
						' sha1 is identical - files are the same
						fileOnCardIdentical = true
					else
'						stop
					endif

				else
'					stop
				endif
			else
'				stop
			endif
		else
'			stop
		endif

		' if the file is not on the card or is different, add it to the list of files that need to be downloaded
		if not fileOnCardIdentical then
			filesToTransfer.push(fileInSite)
		endif
	next

	return filesToTransfer

End Function


Function GetSHA1(path As String) As String

	ba = CreateObject("roByteArray")
	ok = ba.ReadFile(path)
	hashGen = CreateObject("roHashGenerator", "SHA1")
	return hashGen.hash(ba).ToHexString()

End Function
