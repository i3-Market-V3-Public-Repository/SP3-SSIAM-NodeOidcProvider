(async function () {
  const protocol = location.protocol === 'http' ? 'ws' : 'wss'

  const ws = new WebSocket(protocol + '://' + location.host + location.pathname + '/socket')
  ws.onmessage = async (ev) => {
    // Create an invisible form and submit it
    const form = document.createElement('form')
    form.setAttribute('action', location.pathname + '/login')
    form.setAttribute('method', 'POST')
    form.style.display = 'none'

    const didInput = document.createElement('input')
    didInput.setAttribute('name', 'did')
    didInput.value = ev.data
    form.appendChild(didInput)

    document.body.appendChild(form)

    form.submit()
  }
})()
