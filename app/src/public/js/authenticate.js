(async function () {
  const protocol = location.protocol === 'http' ? 'ws' : 'wss'

  const ws = new WebSocket(protocol + '://' + location.host + location.pathname + '/socket')
  console.log(protocol + '://' + location.host + location.pathname + '/socket')
  let url;
  ws.onmessage = async (ev) => {

    console.log('ev')
    console.log(ev)
    let data = ev.data.split(',');
    url = 'http://'+ data[1] + '?did=' + data[0]
    console.log('url redirect: ' + url)
    // Create an invisible form and submit it
    /*
    const form = document.createElement('form')
    form.setAttribute('action', '/vc/did/complete')
    form.setAttribute('method', 'POST')
    form.style.display = 'none'

    
    //Se è una post metterlo nel body in questo modo
    
    const didInput = document.createElement('input')
    didInput.setAttribute('name', 'url')
    didInput.value = url
    form.appendChild(didInput)

    document.body.appendChild(form)

    form.submit()*/
    document.location.href = url;
  }
})()
