/// <reference path="global.d.ts" />

(async function () {
  
  const protocol = location.protocol === 'http' ? 'ws' : 'wss' 
  const webSocketURL = protocol + '://' + location.host + location.pathname + '/socket'
  const initialTries = 20
  const reconnectInterval = 500
  const keepAliveInterval = 10000

  let tries = initialTries
  let reconnect = true
  let intervalId

  connectWebSocket()

  /**
   * When a code is received by the websocket, send the code to the login endpoint
   */
  async function onCodeReceived (ev) {
    console.log('Received a message in the socket', ev.data)
    reconnect = false

    // Create an invisible form and submit it
    const form = document.createElement('form')
    form.setAttribute('action', location.pathname + '/login')
    form.setAttribute('method', 'POST')
    form.style.display = 'none'

    const codeInput = document.createElement('input')
    codeInput.setAttribute('name', 'code')
    codeInput.value = ev.data
    form.appendChild(codeInput)

    document.body.appendChild(form)

    form.submit()
  }

  /**
   * Connect the websocket to the specific interaction.
   *
   * - If the WebSocket is closed reconnect it.
   * - Send keep alive messages periodically
   */
  function connectWebSocket () {
    const ws = new WebSocket(webSocketURL)
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = undefined
    }

    ws.onmessage = onCodeReceived

    ws.onopen = () => {
      console.log('Socket sucessfuly connected')
      tries = initialTries
      intervalId = setInterval(() => {
        ws.send('@keepalive@')
      }, keepAliveInterval)
    }

    ws.onclose = () => {
      if (!reconnect) {
        return
      }

      console.log(`Socket disconnected, tries remaining ${tries}`)
      tries--
      if (tries > 0) {
        setTimeout(connectWebSocket, reconnectInterval)
      }
    }
  }

  const main = async () => {

    const MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    const base58 = {
        encode: function(B,A){var d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/58|0;d[j]=n%58;j++}}while(j--)s+=A[d[j]];return s},
        decode: function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)}
    }

    const sessionState = document.getElementById('session-state')

    const { WalletProtocol, HttpInitiatorTransport, Session } = walletProtocol
    const { openModal, LocalSessionManager } = walletProtocolUtils
    const { WalletApi } = walletProtocolApi
    
    const transport = new HttpInitiatorTransport({ getConnectionString: openModal })
    const protocol = new WalletProtocol(transport)
    const sessionManager = new LocalSessionManager(protocol)
    

    sessionManager
    .$session
    .subscribe((session) => {
        sessionState.innerText = session !== undefined ? 'ON' : 'OFF'
        if(session !== undefined) {
            console.log('enabling flow')              
            const api = new WalletApi(session)     
            api.disclosure.disclose({ jwt: rawSdr }).then(result => {                
                // console.log('selective disclosure response:')
                // console.log(result.jwt)

                // prepare the object to send
                const form = document.createElement('form')
                console.log(location.pathname + 'login')
                form.setAttribute('action', location.pathname + '/login')
                form.setAttribute('method', 'POST')
                form.style.display = 'none'

                const codeInput = document.createElement('input')
                codeInput.setAttribute('name', 'code')
                codeInput.value = result.jwt
                form.appendChild(codeInput)

                document.body.appendChild(form)
                form.submit()
            })

        } else {
            console.log('no session')
            return
        }
        
    })
    
    await sessionManager.loadSession()
    await sessionManager.createIfNotExists()
}
window.onload = main
})()
