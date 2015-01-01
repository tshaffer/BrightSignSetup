Sub InitializeServer()

    m.localServer = CreateObject("roHttpServer", { port: 8080 })
    m.localServer.SetPort(m.msgPort)

	m.manualRecordAA =					{ HandleEvent: manualRecord, mVar: m }
	m.recordingAA =						{ HandleEvent: getRecording, mVar: m }
	m.deleteRecordingAA =				{ HandleEvent: deleteRecording, mVar: m }
	m.recordingsAA =					{ HandleEvent: recordings, mVar: m }

	m.TestRecordAA =					{ HandleEvent: TestRecord, mVar: m }
	m.RecordAA =						{ HandleEvent: Record, mVar: m }

	m.localServer.AddGetFromEvent({ url_path: "/manualRecord", user_data: m.manualRecordAA })
	m.localServer.AddGetFromEvent({ url_path: "/recording", user_data: m.recordingAA })
	m.localServer.AddGetFromEvent({ url_path: "/deleteRecording", user_data: m.deleteRecordingAA })
	m.localServer.AddGetFromEvent({ url_path: "/recordings", user_data: m.recordingsAA })

'	m.localServer.AddGetFromEvent({ url_path: "/", user_data: m.TestRecordAA })
	m.localServer.AddGetFromEvent({ url_path: "/TestRecord", user_data: m.TestRecordAA })

	m.localServer.AddGetFromEvent({ url_path: "/Record", user_data: m.RecordAA })

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
	path$ = GetMP4orTS(recording.Path)
	if path$ = "" then
		print "recording at path " + recording.Path + " not found."
		stop
	else
		recording.Path = path$
	endif

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
	print "deleteRecording::play recording ";recordingId

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

		else
			print "recording " + recording.Title + " not found at " + recording.Path + ". Id = " + stri(recording.RecordingId)
		endif
	next

End Sub


Function GetMP4orTS(tsPath$ As String) As String

	mp4Path$ = Left(tsPath$, len(tsPath$) - 2) + "mp4"
	readFile = CreateObject("roReadFile", mp4Path$)
	if type(readFile) = "roReadFile" return mp4Path$

	readFile = CreateObject("roReadFile", tsPath$)
	if type(readFile) = "roReadFile" return tsPath$

	return ""

End Function


Sub Record(userData as Object, e as Object)
End Sub


Sub manualRecord(userData as Object, e as Object)

	print "Manual Record invoked"

    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	title$ = requestParams["title"]
	year% = int(val(requestParams["year"]))
	month% = int(val(requestParams["month"]))
	day% = int(val(requestParams["day"]))
	hour% = int(val(requestParams["startTimeHours"]))
	minute% = int(val(requestParams["startTimeMinutes"]))
	duration% = int(val(requestParams["duration"]))
	channel$ = requestParams["channel"]
	useTuner$ = requestParams["useTuner"]	' true or false

	dateTime = CreateObject("roDateTime")
	dateTime.SetYear(year%)
	dateTime.SetMonth(month% + 1)
	dateTime.SetHour(hour%)
	dateTime.SetDay(day%)
	dateTime.SetMinute(minute%)

	' title$ = "MR at " + dateTime.GetString() + " on " + channel$

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


Sub TestRecord(userData as Object, e as Object)

	' fileName = <file name>
	' duration = <duration in seconds>
    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	fileName$ = requestParams["fileName"]
	duration$ = requestParams["duration"]

	mVar.StartRecord(fileName$, int(val(duration$)))

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("recording to file " + fileName$)
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


