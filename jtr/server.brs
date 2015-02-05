Sub InitializeServer()

    m.localServer = CreateObject("roHttpServer", { port: 8080 })
    m.localServer.SetPort(m.msgPort)

	m.manualRecordAA =					{ HandleEvent: manualRecord, mVar: m }
	m.recordNowAA =						{ HandleEvent: recordNow, mVar: m }
	m.recordingAA =						{ HandleEvent: getRecording, mVar: m }
	m.deleteRecordingAA =				{ HandleEvent: deleteRecording, mVar: m }
	m.recordingsAA =					{ HandleEvent: recordings, mVar: m }
	m.fileToTranscodeAA =				{ HandleEvent: fileToTranscode, mVar: m }

	m.showUIAA =						{ HandleEvent: showUI, mVar: m}

	m.pauseAA =							{ HandleEvent: pause, mVar: m}
	m.playAA =							{ HandleEvent: play, mVar: m}
	m.instantReplayAA =					{ HandleEvent: instantReplay, mVar: m}
	m.quickSkipAA =						{ HandleEvent: quickSkip, mVar: m}

	m.filePostedAA =					{ HandleEvent: filePosted, mVar: m }

	m.localServer.AddGetFromEvent({ url_path: "/recordNow", user_data: m.recordNowAA })
	m.localServer.AddGetFromEvent({ url_path: "/manualRecord", user_data: m.manualRecordAA })
	m.localServer.AddGetFromEvent({ url_path: "/recording", user_data: m.recordingAA })
	m.localServer.AddGetFromEvent({ url_path: "/deleteRecording", user_data: m.deleteRecordingAA })
	m.localServer.AddGetFromEvent({ url_path: "/recordings", user_data: m.recordingsAA })

	m.localServer.AddGetFromEvent({ url_path: "/fileToTranscode", user_data: m.fileToTranscodeAA })
	m.localServer.AddPostToFile({ url_path: "/TranscodedFile", destination_directory: GetDefaultDrive(), user_data: m.filePostedAA })

	m.localServer.AddGetFromEvent({ url_path: "/showUI", user_data: m.showUIAA })

	m.localServer.AddGetFromEvent({ url_path: "/pause", user_data: m.pauseAA })
	m.localServer.AddGetFromEvent({ url_path: "/play", user_data: m.playAA })
	m.localServer.AddGetFromEvent({ url_path: "/instantReplay", user_data: m.instantReplayAA })
	m.localServer.AddGetFromEvent({ url_path: "/quickSkip", user_data: m.quickSkipAA })

' incorporation of site downloader code
    m.siteFilePostedAA = { HandleEvent: siteFilePosted, mVar: m }
    m.localServer.AddPostToFile({ url_path: "/UploadFile", destination_directory: GetDefaultDrive(), user_data: m.siteFilePostedAA })

    m.getFilesToTransferAA =  { HandleEvent: getFilesToTransfer, mVar: m }
    m.localServer.AddPostToFile({ url_path: "/GetFilesToTransfer", destination_directory: GetDefaultDrive(), user_data: m.getFilesToTransferAA })

    m.restartScriptAA = { HandleEvent: restartScript, mVar: m }
    m.localServer.AddGetFromEvent({ url_path: "/ExitScript", user_data: m.restartScriptAA })


' Bonjour advertisement
'    service = { name: "JTR Web Service", type: "_http._tcp", port: 8080, _functionality: BSP.lwsConfig$, _serialNumber: sysInfo.deviceUniqueID$, _unitName: unitName$, _unitNamingMethod: unitNamingMethod$,  }
'    JTR.advert = CreateObject("roNetworkAdvertisement", service)

	serverDirectory$ = "www"
	listOfServerFiles = []
	ListFiles(serverDirectory$, listOfServerFiles)
	m.AddHandlers(serverDirectory$, listOfServerFiles)

End Sub


Sub AddHandlers(serverDirectory$ As String, listOfHandlers As Object)

	' first filePath = www/remote-snapshot/angular.min.js
	' parts = www/remote-snapshot/angular.min.js
	' serverDirectory$ = www

	for each filePath in listOfHandlers

		ext = GetFileExtension(filePath)
		if ext <> invalid then

			contentType$ = GetMimeTypeByExtension(ext)
	
			url$ = Right(filePath, len(filePath) - len(serverDirectory$))

			m.localServer.AddGetFromFile({ url_path: url$, filename: filePath, content_type: contentType$ })

			if url$ = "/index.html" then
				m.localServer.AddGetFromFile({ url_path: "/", filename: filePath, content_type: contentType$ })
			endif

		endif

	next

End Sub


' endpoint invoked when the user wants to playback a specific recording - playback resumes from where it left off
Sub getRecording(userData as Object, e as Object)

	print "recording endpoint invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	recordingId = requestParams["recordingId"]
	print "getRecording::play recording ";recordingId

	recording = mVar.GetDBRecording(recordingId)

	playRecordingMessage = CreateObject("roAssociativeArray")
	playRecordingMessage["EventType"] = "RESUME_PLAYBACK"
	playRecordingMessage["Recording"] = recording
	mVar.msgPort.PostMessage(playRecordingMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


' endpoint invoked when the user selects Delete Recording from Replay Guide
Sub deleteRecording(userData as Object, e as Object)

	print "delete recording endpoint invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	recordingId = requestParams["recordingId"]
	print "deleteRecording::recordingId ";recordingId

	' for now, delete the file off the card. future, don't delete files until necessary to allow undo
	recording = mVar.GetDBRecording(recordingId)
	if type(recording) = "roAssociativeArray" then
		path = GetFilePath(recording.FileName)
		while path <> ""
			print "path of file to delete is ";path
			' TODO - log the deletion
			ok = DeleteFile(path)
			if not ok then
				print "file ";path;" not found in delete operation."
				' TODO - log the failure to find the file
			endif
			path = GetFilePath(recording.FileName)
		endwhile
	else
		e.AddResponseHeader("Content-type", "text/plain; charset=utf-8")
		e.SetResponseBodyString("Recording not found.")
	    e.SendResponse(404)
		return
	endif

	' add to deleted recordings table

	' remove from database
	mVar.DeleteDBRecording(recordingId)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub recordings(userData as Object, e as Object)

	print "recordings endpoint invoked"

    mVar = userData.mVar

    root = CreateObject("roXMLElement")
    root.SetName("BrightSignRecordings")

	' get remaining space on card
	storageInfo = CreateObject("roStorageInfo", "SD:")
	freeSpace = StripLeadingSpaces(stri(storageInfo.GetFreeInMegabytes()))
	root.AddAttribute("freeSpace", freeSpace)

	PopulateRecordings(mVar, root)

    xml = root.GenXML({ indent: " ", newline: chr(10), header: true })

    e.AddResponseHeader("Content-type", "text/xml")
    e.SetResponseBodyString(xml)
    e.SendResponse(200)

End Sub


Sub PopulateRecordings(mVar As Object, root As Object)

	jtrRecordings = mVar.GetDBRecordings()

	for each recording in jtrRecordings
		
'		print "recording " + recording.Title

		' get path for video from db's file name
		' recording.Path = GetFilePath(recording.Path)

		' only include the entry if the file actually exists
		readFile = CreateObject("roReadFile", recording.Path)
		if type(readFile) = "roReadFile" then
'			print "recording found at " + recording.Path

			recordingElem = root.AddElement("BrightSignRecording")

			recordingIdElem = recordingElem.AddElement("recordingId")
			recordingIdElem.SetBody(stri(recording.RecordingId))

			titleElem = recordingElem.AddElement("title")
			titleElem.SetBody(recording.Title)

			startDateTimeElem = recordingElem.AddElement("startDateTime")
			startDateTimeElem.SetBody(recording.StartDateTime)

			durationElem = recordingElem.AddElement("duration")
			durationElem.SetBody(stri(recording.Duration))

			pathElem = recordingElem.AddElement("path")
			pathElem.SetBody(recording.Path)

			lastViewedPositionElem = recordingElem.AddElement("lastViewedPosition")
' the following does not work - BrightScript bug apparently
'			lastViewedPositionElem.SetBody(recording.LastViewedPosition)
			lastViewedPositionElem.SetBody(stri(recording.LastViewedPosition))

' the following does not work - BrightScript bug apparently
			transcodeCompleteElem = recordingElem.AddElement("transcodeComplete")
			transcodeCompleteElem.SetBody(recording.TranscodeComplete)

			fileNameElem = recordingElem.AddElement("fileName")
			fileNameElem.SetBody(recording.FileName)

		else
			print "recording " + recording.Title + " not found at " + recording.Path + ". Id = " + stri(recording.RecordingId)
		endif
	next

End Sub


Sub recordNow(userData as Object, e as Object)

	print "record now invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	title$ = requestParams["title"]
	duration% = int(val(requestParams["duration"]))

	recordNowMessage = CreateObject("roAssociativeArray")
	recordNowMessage["EventType"] = "RECORD_NOW"
	recordNowMessage["Title"] = title$
	recordNowMessage["Duration"] = duration%

	mVar.msgPort.PostMessage(recordNowMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("herro Joel")
    e.SendResponse(200)

End Sub


Sub manualRecord(userData as Object, e as Object)

	print "Manual Record invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	title$ = requestParams["title"]
	duration% = int(val(requestParams["duration"]))
	channel$ = requestParams["channel"]
	useTuner$ = requestParams["useTuner"]	' true or false

	dateTime = CreateObject("roDateTime")
	dateTime.FromIsoString(requestParams["bsIsoDateTime"])

	addManualRecordMessage = CreateObject("roAssociativeArray")
	addManualRecordMessage["EventType"] = "ADD_MANUAL_RECORD"
	addManualRecordMessage["Title"] = title$
	addManualRecordMessage["Channel"] = channel$
	addManualRecordMessage["DateTime"] = dateTime
	addManualRecordMessage["Duration"] = duration%
	addManualRecordMessage["UseTuner"] = useTuner$
	mVar.msgPort.PostMessage(addManualRecordMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("herro Joel")
    e.SendResponse(200)

End Sub


Sub fileToTranscode(userData as Object, e as Object)

	print "fileToTranscode endpoint invoked"

    mVar = userData.mVar

    root = CreateObject("roXMLElement")
    root.SetName("BrightSignFileToTranscode")

	fileToTranscodeRecord = mVar.GetDBFileToTranscode()

	if type(fileToTranscodeRecord) = "roAssociativeArray" then

		' setup handler so this file can be retrieved
		print "fileToTranscode: add endpoint " + "/" + fileToTranscodeRecord.path
		mVar.localServer.AddGetFromFile({ url_path: "/" + fileToTranscodeRecord.path, filename: fileToTranscodeRecord.path, content_type: "video/mpeg"})

		' information to return: id, path
		fileToTranscodeElem = root.AddElement("FileToTranscode")

		idElem = fileToTranscodeElem.AddElement("id")
		idElem.SetBody(stri(fileToTranscodeRecord.RecordingId))

		pathElem = fileToTranscodeElem.AddElement("path")
		pathElem.SetBody(fileToTranscodeRecord.path)

	    xml = root.GenXML({ indent: " ", newline: chr(10), header: true })

		e.AddResponseHeader("Content-type", "text/xml")
		e.SetResponseBodyString(xml)
		e.SendResponse(200)
	else
		e.AddResponseHeader("Content-type", "text/plain; charset=utf-8")
		e.SetResponseBodyString("No file to transcode.")
		e.SendResponse(404)
	endif


End Sub


Sub filePosted(userData as Object, e as Object)

    mVar = userData.mVar

    print "respond to filePosted request"

	destinationFilename = e.GetRequestHeader("Destination-Filename")
	MoveFile(e.GetRequestBodyFile(), destinationFilename)

	' update the database to indicate that this file has been transcoded
	dbId = int(val(e.GetRequestHeader("DB-Id")))
	mVar.UpdateDBTranscodeComplete(dbId)

	recording = mVar.GetDBRecording(stri(dbId))
	tsPath$ = GetTSFilePath(recording.FileName)
	print "Transcode operation complete - delete ";tsPath$
	ok = DeleteFile(tsPath$)
	if not ok print "Delete after transcode complete failed"

	e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

End Sub


Sub pause(userData as Object, e as Object)

	print "pause endpoint invoked"

    mVar = userData.mVar

	pauseMessage = CreateObject("roAssociativeArray")
	pauseMessage["EventType"] = "PAUSE"
	mVar.msgPort.PostMessage(pauseMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub play(userData as Object, e as Object)

	print "play endpoint invoked"

    mVar = userData.mVar

	playMessage = CreateObject("roAssociativeArray")
	playMessage["EventType"] = "PLAY"
	mVar.msgPort.PostMessage(playMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub instantReplay(userData as Object, e as Object)

	print "instantReplay endpoint invoked"

    mVar = userData.mVar

	instantReplayMessage = CreateObject("roAssociativeArray")
	instantReplayMessage["EventType"] = "INSTANT_REPLAY"
	mVar.msgPort.PostMessage(instantReplayMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Sub quickSkip(userData as Object, e as Object)

	print "quickSkip endpoint invoked"

    mVar = userData.mVar

	quickSkipMessage = CreateObject("roAssociativeArray")
	quickSkipMessage["EventType"] = "QUICK_SKIP"
	mVar.msgPort.PostMessage(quickSkipMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


Function GetFileExtension(file as String) as Object
  s=file.tokenize(".")
  if s.Count()>1
    ext=s.pop()
    return ext
  end if
  return invalid
end Function


Function GetMimeTypeByExtension(ext as String) as String

  ' start with audio types '
  if ext="mp3"
    return "audio/mpeg"
  else if ext="ogg"
	return "audio/ogg"

  ' now image types '
  else if ext="gif"
    return "image/gif"
  else if ext="jpeg"
    return "image/jpeg"
  else if ext="jpg"
    return "image/jpeg"
  else if ext="png"
    return "image/png"
  else if ext="svg"
    return "image/svg+xml"

  ' now text types'
  else if ext="css"
    return "text/css"
  else if ext="js"
    return "application/JavaScript"
  else if ext="csv"
    return "text/csv"
  else if ext="html"
    return "text/html"
  else if ext="htm"
    return "text/html"
  else if ext="txt"
    return "text/plain"
  else if ext="xml"
    return "text/xml"

  ' now some video types'
  else if ext="mpeg"
    return "video/mpeg"
  else if ext="mp4"
    return "video/mp4"
  else if ext="ts"
    return "video/mpeg"
  else if ext="mov"
	return "video/quicktime"
  else if ext="mkv"
	return "video/x-matroska"
  end if
  return ""
end Function


' Site downloader functionality - allows downloading of updated source while jtr is running.
Sub restartScript(userData as Object, e as Object)

    print "respond to ExitScript request"
    
    e.SetResponseBodyString("RECEIVED")
    e.SendResponse(200)

    print "restart the program"
    RestartScript()
        
End Sub


Function getFilesToTransfer(userData as Object, e as Object)

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


Sub siteFilePosted(userData as Object, e as Object)

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


' endpoint invoked when the the javascript proactively displays a UI screen
Sub showUI(userData as Object, e as Object)

    mVar = userData.mVar

	print "showUI endpoint invoked"

	showUIMessage = CreateObject("roAssociativeArray")
	showUIMessage["EventType"] = "SHOW_UI"
	mVar.msgPort.PostMessage(showUIMessage)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub




