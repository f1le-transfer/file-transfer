'use strict';
compare_token()

const HEADER_LEN = 500
let peerConnection;
let sendChannel;
let fileReader;

/**
 * Return dom element
 * @param {object} id_name – id of the element
 * @returns {object}
 */
const elem = (id_name) => document.getElementById(id_name)

/**
 * Log data about RTC
 * @param  {...any} info – information
 * @returns {undefined}
 */
const log = (...info) => console.log('%c[RTC]', `color: green;`, ...info)

// Channel for communicate between window and worker(tcp_conn.js)
const broadcast = new BroadcastChannel('tcp_channel');
broadcast.addEventListener('message', async ({ data }) => {
  if (!data.offer && !data.listAvailableFiles && !data.getListAvailableFiles) {
    console.log('[WS MSG]', data)
  }
})  

/**
 * Send message\object to the tcp server
 * @param {*} data – data for server 
 * @returns {undefined}
 */
const send_to_server = (data) => {
  /**
   * If websocket connection use like signaling channel
   * then we send offer and wait until server send offer back.
   */
  if (data.offer) {
    return new Promise((resolve, reject) => {
      broadcast.postMessage(data)
      broadcast.addEventListener('message', ({ data }) => {
        if ('offer' in data && data.answer) {
          resolve(data)
        }   
      })
    })
  }
  broadcast.postMessage(data)
}
document.getElementById('send_btn').onclick = () => {
  send_to_server({ msg: prompt('msg?') })
};

elem('sendFile').onclick = () => createConnection('sendFile')
elem('receiveFile').onclick = () => createConnection('receiveFile')
elem('deleteFile').onclick = () => deleteFile()

/**
 * Create RTC peer connection
 * @returns {undefined}
 */
async function createConnection(isSendFile) {
  /**
   * Configuration for peer connection
   * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection
   */
  const configuration = {
    iceServers: [{'urls': 'stun:stun.l.google.com:19302'}],
    sdpSemantics: 'unified-plan',
    // sdpSemantics: 'plan-b', // another future of the sdpSemantics
    bundlePolicy: "max-compat"
  }

  peerConnection = new RTCPeerConnection(configuration)
  log('Created local peer connection object peerConnection.')

  peerConnection.addEventListener('icecandidate', e => {
    if (e.candidate) {
      /**
       * Wait until iceGatheringState complete
       * then send ice candidate to the server.
       */
      new Promise((resolve, reject) => {
        function checkState() {
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        }
        peerConnection.addEventListener('icegatheringstatechange', checkState)
      })
      .then(() => {
        send_to_server({ 'new-ice-candidate':  JSON.stringify(e.candidate) })
      })
    }
  })

  peerConnection.addEventListener('iceconnectionstatechange', () => {
    log('iceconnectionstatechange:', peerConnection.iceConnectionState)
  })

  peerConnection.addEventListener('signalingstatechange', () => {
    log('signalingstatechange:', peerConnection.signalingState)
  })

  /**
   * Options for data channel
   * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel
   */
  const channel_options = {
    protocol: 'TCP'
  }

  /**
   * createDataChannel docs
   * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel
   */
  sendChannel = peerConnection.createDataChannel('ft', channel_options)

  /**
   * sendChannel options docs
   * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/binaryType
   */
  sendChannel.binaryType = 'arraybuffer'
  log('Created send data channel.')

  sendChannel.addEventListener('open', onSendChannelStateChange.bind(null, isSendFile=='sendFile'));
  sendChannel.addEventListener('close', onSendChannelStateChange.bind(null, isSendFile=='sendFile'));
  sendChannel.addEventListener('error', onError);
  // sendChannel.addEventListener('message', (d) => log('Data from channel', d))

  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      // Wait until peer complete
      return new Promise((resolve, reject) => {
        if (peerConnection.iceGatheringState === 'complete') {
          resolve()
        } else {
          function checkState() {
            if (peerConnection.iceGatheringState === 'complete') {
              peerConnection.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          }
          peerConnection.addEventListener('icegatheringstatechange', checkState)
        }
      })
    })
    .then(() => {
      // Send over out signaling server offer
      const offer = peerConnection.localDescription
      return send_to_server({ offer: JSON.stringify(offer), remoteConn: true })
    })
    .then(async (data) => {
      // Receive offer from remote peer and set it
      const remoteDesc = new RTCSessionDescription(data.offer)
      await peerConnection.setRemoteDescription(remoteDesc)
    })
}

/**
 * Handle sendChannel state
 * @returns {undefined}
 */
function onSendChannelStateChange(isSendFile) {
  if (sendChannel) {
    const { readyState } = sendChannel
    log('Send channel state is:', readyState)
    /**
     * When peerConnection establish and sendCannel state is open, 
     * start sending chunks of the file.
     */
    if (readyState === 'open' && isSendFile) {
      sendFile()
    } else {
      receiveFile()
    }
  }
}

/**
 * Send file via peerConnection
 * @returns {undefined}
 */
function sendFile() {
  /**
   * To define chunk number we can:
   * 1. Send two separate message, like first header and second body.
   * 2. Write json header on the top of the file and send it in one message.
   * At the moment i use 2 variant.
   */
  const file = elem('fileInput').files[0]
  const chunkColl = new chunkCollector()
  let chunk = 1;
  console.log(`[FILE] ${[file.name, file.size, file.type, file.lastModified].join(' ')}`)

  const file_info = {
    name: file.name.split('.')[0],
    ext: file.name.split('.')[1],
    full_name: file.name,
    size: file.size,
    type: file.type,
    dir: '/work-files/',
    lastModified: file.lastModified
  }

  const chunkSize = 16384
  fileReader = new FileReader()
  let offset = 0 

  fileReader.addEventListener('error', error => console.error('[File] reading file:', error))
  fileReader.addEventListener('abort', event => console.log('[File] reading aborted:', event))
  fileReader.addEventListener('load', async e => {
    console.log('[FILE] load', e)
    const body_buffer = e.target.result
    const chunk_hash = await hashChunk(body_buffer)
    file_info.hash = chunk_hash
    const header = JSON.stringify({ chunk, ...file_info })

    console.log('[HEADER LEN]', header.length)
    if (header.length > HEADER_LEN) throw new Error('File name it too long.');

    sendChannel.send(create_full_buffer(header, body_buffer))
    chunkColl.add({
      chunk_id: chunk_hash,
      chunk_order: chunk++,
      object: {
        version: 1,
        is_folder: false,
        file_name: file.name.split('.')[0],
        file_extention: file.name.split('.')[1],
        file_size: file.size,
        file_dir: '/work-files/',
        modified: file.lastModified,
        user: {
          user_name: JSON.parse(localStorage.getItem('token')).username,
          device: {
            userAgent: window.navigator.userAgent
          }
        }
      }
    })

    offset += e.target.result.byteLength
    if (offset < file.size) {
      readSlice(offset)
    }

    // if this is the last chunk then send all metadata to the server
    if (Math.ceil(file.size/chunkSize+1) === chunk) {
      chunkColl.send()
    }
  })

  /**
   * Concat header buffer and body buffer
   * @param {String} header 
   * @param {BufferArray} buf_body
   * @returns BufferArray
   */
  function create_full_buffer(header, buf_body) {
    let buf_head = str2bu(header)
    return appendBuffer(buf_head, buf_body)
  }

  /**
   * Convert string to the ArrayBuffer.
   * @param {String} str 
   * @returns {ArrayBuffer}
   */
  function str2bu(str) {
    if (str.length > HEADER_LEN) {
      throw new Error('Chunk header length greater then allowed length.')
    }
    let buf = new ArrayBuffer(HEADER_LEN)
    let bufView = new Uint8Array(buf)
    str.split('').forEach((v, i) => bufView[i] = str.charCodeAt(i))
    return buf
  }

  /**
   * Concat two buffers in one.
   * @param {ArrayBuffer} b1 
   * @param {ArrayBuffer} b2 
   * @returns {Uint8Array}
   */
  function appendBuffer(b1, b2) {
    let tmp_buffer = new Uint8Array(b1.byteLength + b2.byteLength)
    tmp_buffer.set(new Uint8Array(b1))
    tmp_buffer.set(new Uint8Array(b2), b1.byteLength)
    return tmp_buffer
  }

  const readSlice = o => {
    console.log('[READ] readSlice', o)
    const slice = file.slice(offset, o + chunkSize)
    fileReader.readAsArrayBuffer(slice)
  }
  readSlice(0)
}

/**
 * Handle error from sendChannel
 * @param {Error} error
 * @returns {undefined}
 */
function onError(error) {
  console.error('Error in sendChannel:', error)
}

/**
 * Convert buffer to Uint8Array.
 * @param {BufferArray} buffer
 * @returns {Uint8Array}
 */
function bu2uInt8(buffer) {
  // return new TextDecoder("utf-8").decode(new Uint8Array(buffer))
  return new Uint8Array(buffer)
}

function receiveFile() {
  let file = elem('recvFileName').value
  if (file.length == 0) return console.error('No file name');

  let file_path = Object.entries(CURRENT_FILES).find(([k, v]) => v+'.'+v[0].split('.')[1].endsWith(file))[0]
  sendChannel.send(JSON.stringify({
    isRecvFile: true,
    name: file_path
  }))


  let fileStream = streamSaver.createWriteStream(file)
  let writer = fileStream.getWriter()
  let chunks_info, chunks_writed=1;
  sendChannel.addEventListener('message', ({ data }) => { 
    if (typeof data === 'string') {
      chunks_info = JSON.parse(data)
      console.log('[CHUNK INFO]', chunks_info)
    } else if (data instanceof ArrayBuffer) {
      writer.write(bu2uInt8(data))
      chunks_writed++
      if (chunks_writed == chunks_info.len) {
        writer.close()
      }
    }
  })

  // After sending all chunks to the cloud storage
  // We need to communicate with Metadata database and send there info about chunks.
}

/**
 * Create hash for data chunk
 * @param {ArrayBuffer} chunk 
 * @returns {Promise}
 */
function hashChunk(chunk) {
  return crypto.subtle.digest('SHA-256', chunk)
    .then(hashBuffer => Array.from(new Uint8Array(hashBuffer)))
    .then(hashArray => hashArray.map(b => b.toString(16).padStart(2, '0')).join(''))
    .then(hashHex => hashHex)
}

class chunkCollector {
  constructor() {
    this.chunk_meta_data = []
  }

  add(chunk_info) {
    this.chunk_meta_data.push(chunk_info)
  }

  send() {  
    let requestOptions = {
      method: 'POST',
      headers: auth_header(),
      body: JSON.stringify({ data: this.chunk_meta_data })
    }
    
    fetch('/files/add', requestOptions)
      .then(res => {
        console.log('[METADATA STATUS]', res.status)
      })
      .catch(console.error)
  }
}

function deleteFile() {
  let file = elem('dltFileName').value
  if (file.length == 0) return console.error('No file name');
  let file_path = Object.entries(CURRENT_FILES)
    .find(([k, v]) => {
      console.log(k)
      return k+v[0].split('.')[1].endsWith('test.txt')
    })

  if (typeof file_path?.[0] != 'string') throw new Error('file not found');
  
  send_to_server({ delete: file_path?.[0] })

  fetch('http://localhost/files/del', {
    method: 'DELETE',
    headers: auth_header(),
    body: JSON.stringify({ chunks: CURRENT_FILES[file_path?.[0]].map(c => c.split('.')[2]) })
  })
  .then(console.log, console.error)
}

function auth_header() {
  const { token } = JSON.parse(localStorage.getItem('token'))
  let headers = new Headers()
  headers.append("Content-Type", "application/json")
  headers.append("Authorization", `Bearer ${token}`)
  return headers
}