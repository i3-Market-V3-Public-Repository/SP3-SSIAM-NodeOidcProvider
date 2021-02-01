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
})()
