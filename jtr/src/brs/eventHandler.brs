Function newEventHandler(jtr As Object) As Object

	EventHandler = {}

	EventHandler.jtr = jtr
	EventHandler.msgPort = jtr.msgPort

	EventHandler.engines = []

	EventHandler.AddEngine			= eventHandler_AddEngine
	EventHandler.EventLoop			= eventHandler_EventLoop

	return EventHandler

End Function


Sub eventHandler_AddEngine( engine As Object )

	m.engines.push(engine)

End Sub


Sub eventHandler_EventLoop()

	SQLITE_COMPLETE = 100

    while true
        
        msg = wait(0, m.msgPort)

		print "msg received - type=" + type(msg)

		commandProcessed = false

		if type(msg) = "roHtmlWidgetEvent" then
			eventData = msg.GetData()
			if type(eventData) = "roAssociativeArray" and type(eventData.reason) = "roString" then
				if eventData.reason = "message" then
					aa = eventData.message
					if aa.command = "debugPrint" then
						print aa.debugMessage
						commandProcessed = true
					endif
				endif
			endif
		endif

		if not commandProcessed then

			if type(msg) = "roControlDown" and stri(msg.GetSourceIdentity()) = stri(m.controlPort.GetIdentity()) then
				if msg.GetInt()=12 then
					stop
				endif
			endif

			if type(msg) = "roIRRemotePress" then
				print "remote data = ";msg.getint()
			endif

			if type(msg) = "roIRDownEvent" then
				print "roIRDownEvent data = ";msg
			endif

			if type(msg) = "roIRRepeatEvent" then
				print "roIRRepeatEvent data = ";msg
			endif
		
			if type(msg) = "roSqliteEvent" then
				if msg.GetSqlResult() <> SQLITE_COMPLETE then
					print "roSqliteEvent.GetSqlResult() <> SQLITE_COMPLETE"
					if type(msg.GetSqlResult()) = "roInt" then
						 print "roSqliteEvent.GetSqlResult() = " + stri(roSqliteEvent.GetSqlResult())
					endif
				endif
			endif

			if type(msg) = "roHttpEvent" then
        
				userdata = msg.GetUserData()
				if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
					userData.HandleEvent(userData, msg)
				endif

			else

				numEngines% = m.engines.Count()
				for i% = 0 to numEngines% - 1
					m.engines[i%].EventHandler(msg)
				next

			endif

		endif

	end while

End Sub


