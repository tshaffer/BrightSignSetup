' *************************************************
'
' Hierarchical State Machine Implementation
'
' *************************************************
Function newHSM() As Object

    HSM = CreateObject("roAssociativeArray")
    
    HSM.Initialize = HSMInitialize
	HSM.Constructor = HSMConstructor
    HSM.Dispatch = HSMDispatch
    HSM.IsIn = HSMIsIn
    
    HSM.InitialPseudostateHandler = invalid
	HSM.ConstructorHandler = invalid

    HSM.newHState = newHState
    HSM.topState = invalid
    HSM.activeState = invalid
    
    return HSM
    
End Function


Sub HSMConstructor()

	if type(m.ConstructorHandler) = invalid then stop

	m.ConstructorHandler()

End Sub


Sub HSMInitialize()

' there is definitely some confusion here about the usage of both activeState and m.activeState

    stateData = CreateObject("roAssociativeArray")
    
' empty event used to get super states
    emptyEvent = CreateObject("roAssociativeArray")
    emptyEvent["EventType"] = "EMPTY_SIGNAL"
    
' entry event 
    entryEvent = CreateObject("roAssociativeArray")
    entryEvent["EventType"] = "ENTRY_SIGNAL"

' init event
    initEvent = CreateObject("roAssociativeArray")
    initEvent["EventType"] = "INIT_SIGNAL"  

' execute initial transition     
	m.activeState = m.InitialPseudoStateHandler()
	
' if there is no activeState, the playlist is empty
	if type(m.activeState) <> "roAssociativeArray" return
	
	activeState = m.activeState
	    
' start at the top state
    if type(m.topState) <> "roAssociativeArray" then stop
    sourceState = m.topState
    
    while true
    
        entryStates = CreateObject("roArray", 4, true)
        entryStateIndex% = 0
        
        entryStates[0] = activeState                                            ' target of the initial transition
                
        status$ = m.activeState.HStateEventHandler(emptyEvent, stateData)       ' send an empty event to get the super state
        activeState = stateData.nextState
        m.activeState = stateData.nextState

        while (activeState.id$ <> sourceState.id$)                              ' walk up the tree until the current source state is hit
            entryStateIndex% = entryStateIndex% + 1
            entryStates[entryStateIndex%] = activeState
            status$ = m.activeState.HStateEventHandler(emptyEvent, stateData)
            activeState = stateData.nextState
            m.activeState = stateData.nextState
        end while
        
'        activeState = entryStates[0]                                           ' restore the target of the initial transition
        
        while (entryStateIndex% >= 0)                                           ' retrace the entry path in reverse (desired) order
            entryState = entryStates[entryStateIndex%]
            status$ = entryState.HStateEventHandler(entryEvent, stateData)
            entryStateIndex% = entryStateIndex% - 1
        end while

        sourceState = entryStates[0]                                            ' new source state is the current state
        
        status$ = sourceState.HStateEventHandler(initEvent, stateData)
        if status$ <> "TRANSITION" then
            m.activeState = sourceState
            return
        endif

        activeState = stateData.nextState        
        m.activeState = stateData.nextState
        
    end while

End Sub


Sub HSMDispatch(event As Object)

' if there is no activeState, the playlist is empty
	if type(m.activeState) <> "roAssociativeArray" return

    stateData = CreateObject("roAssociativeArray")
    
' empty event used to get super states
    emptyEvent = CreateObject("roAssociativeArray")
    emptyEvent["EventType"] = "EMPTY_SIGNAL"
    
' entry event 
    entryEvent = CreateObject("roAssociativeArray")
    entryEvent["EventType"] = "ENTRY_SIGNAL"

' exit event 
    exitEvent = CreateObject("roAssociativeArray")
    exitEvent["EventType"] = "EXIT_SIGNAL"

' init event
    initEvent = CreateObject("roAssociativeArray")
    initEvent["EventType"] = "INIT_SIGNAL"  
     
    t = m.activeState                                                       ' save the current state
    
    status$ = "SUPER"
    while (status$ = "SUPER")                                               ' process the event hierarchically
        s = m.activeState
        status$ = s.HStateEventHandler(event, stateData)
        m.activeState = stateData.nextState
'if type(m.activeState) = "roAssociativeArray" then
'    print "m.activeState set to " + m.activeState.id$ + "0"        
'else
'    print "m.activeState set to invalid 0"
'endif
    end while
    
    if (status$ = "TRANSITION")
        path = CreateObject("roArray", 4, true)
        
        path[0] = m.activeState                                             ' save the target of the transition
        path[1] = t                                                         ' save the current state
        
        while (t.id$ <> s.id$)                                              ' exit from the current state to the transition s
            status$ = t.HStateEventHandler(exitEvent, stateData)
            if status$ = "HANDLED" then
                status$ = t.HStateEventHandler(emptyEvent, stateData)
            endif
            t = stateData.nextState
        end while
        
        t = path[0]                                                         ' target of the transition
        
        ' s is the source of the transition
        
        if (s.id$ = t.id$) then                                             ' check source == target (transition to self)
            status$ = s.HStateEventHandler(exitEvent, stateData)            ' exit the source
            ip = 0
        else
            status$ = t.HStateEventHandler(emptyEvent, stateData)           ' superstate of target
            t = stateData.nextState
            if (s.id$ = t.id$) then                                         ' check source == target->super
                ip = 0                                                      ' enter the target
            else
                status$ = s.HStateEventHandler(emptyEvent, stateData)       ' superstate of source
                if (stateData.nextState.id$ = t.id$) then                   ' check source->super == target->super
                    status$ = s.HStateEventHandler(exitEvent, stateData)    ' exit the source
                    ip = 0                                                  ' enter the target
                else
                    if (stateData.nextState.id$ = path[0].id$) then         ' check source->super == target
                        status$ = s.HStateEventHandler(exitEvent, stateData)     ' exit the source
                    else                                                    ' check rest of source == target->super->super and store the entry path along the way
                        iq = 0                                              ' indicate LCA not found
                        ip = 1                                              ' enter target and its superstate
                        path[1] = t                                         ' save the superstate of the target
                        t = stateData.nextState                             ' save source->super
                                                                            ' get target->super->super
                        status$ = path[1].HStateEventHandler(emptyEvent, stateData)
                        while (status$ = "SUPER")
                             ip = ip + 1
                             path[ip] = stateData.nextState                 ' store the entry path
                             if (stateData.nextState.id$ = s.id$) then      ' is it the source?
                                iq = 1                                      ' indicate that LCA found
                                ip = ip - 1                                 ' do not enter the source
                                status$ = "HANDLED"                         ' terminate the loop
                             else                                           ' it is not the source; keep going up
                                status$ = stateData.nextState.HStateEventHandler(emptyEvent, stateData)
                             endif
                        end while
                    
                        if (iq = 0) then                                    ' LCA not found yet
                            status$ = s.HStateEventHandler(exitEvent, stateData) ' exit the source
                            
                                                                            ' check the rest of source->super == target->super->super...
                            iq = ip
                            status = "IGNORED"                              ' indicate LCA not found
                            while (iq >= 0)
                                if (t.id$ = path[iq].id$) then              ' is this the LCA?
                                    status = "HANDLED"                      ' indicate LCA found
                                    ip = iq - 1                             ' do not enter LCA
                                    iq = -1                                 ' terminate the loop
                                else
                                    iq = iq -1                              ' try lower superstate of target
                                endif
                            end while
                            
                            if (status <> "HANDLED") then                   ' LCA not found yet?
                            
                                                                            ' check each source->super->... for each target->super...
                                status = "IGNORED"                          ' keep looping
                                while (status <> "HANDLED")
                                    status$ = t.HStateEventHandler(exitEvent, stateData)
                                    if (status$ = "HANDLED") then
                                        status$ = t.HStateEventHandler(emptyEvent, stateData)
                                    endif
                                    t = stateData.nextState                 ' set to super of t
                                    iq = ip
                                    while (iq > 0)
                                        if (t.id$ = path[iq].id$) then      ' is this the LCA?
                                            ip = iq - 1                     ' do not enter LCA
                                            iq = -1                         ' break inner
                                            status = "HANDLED"              ' break outer
                                        else
                                            iq = iq - 1
                                        endif
                                    end while
                                end while
                            endif
                        endif
                    endif
                endif
            endif
        endif
        
        ' retrace the entry path in reverse (desired) order...
        while (ip >= 0)
            status$ = path[ip].HStateEventHandler(entryEvent, stateData)    ' enter path[ip]
            ip = ip - 1
        end while
        
        t = path[0]                                                         ' stick the target into register */
        m.activeState = t                                                   ' update the current state */
'print "m.activeState set to " + m.activeState.id$ + "1"        


        ' drill into the target hierarchy...
        status$ = t.HStateEventHandler(initEvent, stateData)
        m.activeState = stateData.nextState
        while (status$ = "TRANSITION")
' stop            
            ip = 0
            path[0] = m.activeState
            status$ = m.activeState.HStateEventHandler(emptyEvent, stateData)            ' find superstate
            m.activeState = stateData.nextState
'print "m.activeState set to " + m.activeState.id$ + "2"        
            while (m.activeState.id$ <> t.id$)
                ip = ip + 1
                path[ip] = m.activeState
                status$ = m.activeState.HStateEventHandler(emptyEvent, stateData)        ' find superstate
                m.activeState = stateData.nextState
'print "m.activeState set to " + m.activeState.id$ + "3"        
            end while
            m.activeState = path[0]
'print "m.activeState set to " + m.activeState.id$ + "4"        
            
            while (ip >= 0)
                status$ = path[ip].HStateEventHandler(entryEvent, stateData)
                ip = ip - 1
            end while
            
            t = path[0]
            
            status$ = t.HStateEventHandler(initEvent, stateData)

        end while
        
    endif
    
    m.activeState = t   ' set the new state or restore the current state
'print "m.activeState set to " + m.activeState.id$ + "5"        
    
End Sub


Function HSMIsIn() As Boolean

    return false

End Function


Function newHState(obj As Object, id$ As String) As Object

    HState = CreateObject("roAssociativeArray")
    
    HState.HStateEventHandler = invalid         ' filled in by HState instance
    
    HState.stateMachine = m
    HState.obj = obj
    
    HState.superState = invalid                 ' filled in by HState instance
    HState.id$ = id$
    
    return HState
    
End Function


Function STTopEventHandler(event As Object, stateData As Object) As Object
	
    stateData.nextState = invalid
    return "IGNORED"
    
End Function


