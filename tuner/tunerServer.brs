Sub InitializeServer()

    m.localServer = CreateObject("roHttpServer", { port: 8080 })
    m.localServer.SetPort(m.msgPort)

	m.TuneChannelAA =					{ HandleEvent: TuneChannel, mVar: m }

	m.localServer.AddGetFromEvent({ url_path: "/", user_data: m.TuneChannelAA })
	m.localServer.AddGetFromEvent({ url_path: "/Tune", user_data: m.TuneChannelAA })

'    service = { name: "JTR Web Service", type: "_http._tcp", port: 8080, _functionality: BSP.lwsConfig$, _serialNumber: sysInfo.deviceUniqueID$, _unitName: unitName$, _unitNamingMethod: unitNamingMethod$,  }
'    JTR.advert = CreateObject("roNetworkAdvertisement", service)

End Sub


Sub TuneChannel(userData as Object, e as Object)

	' channelName = <channel name>
    mVar = userData.mVar

	requestParams = e.GetRequestParams()

	channelName$ = requestParams["channelName"]
	mVar.Tune(channelName$)

    e.AddResponseHeader("Content-type", "text/plain")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

End Sub


