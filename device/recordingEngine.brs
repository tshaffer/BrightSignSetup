Function newRecordingEngine(jtr As Object) As Object

    RecordingEngine = newHSM()
    RecordingEngine.InitialPseudostateHandler = InitializeRecordingEngine

	RecordingEngine.msgPort = jtr.msgPort

'	RecordingEngine.InitializeDisplay			= recordingEngine_InitializeDisplay

    RecordingEngine.stTop = RecordingEngine.newHState(RecordingEngine, "Top")
    RecordingEngine.stTop.HStateEventHandler = STTopEventHandler

    RecordingEngine.stIdle = RecordingEngine.newHState(RecordingEngine, "RecordingIdle")
    RecordingEngine.stIdle.HStateEventHandler = STRecordingEngineIdleEventHandler
	RecordingEngine.stIdle.superState = RecordingEngine.stTop

	RecordingEngine.topState = RecordingEngine.stTop

	return RecordingEngine

End Function


Function InitializeRecordingEngine() As Object

	return m.stIdle

End Function


Function STRecordingEngineIdleEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


