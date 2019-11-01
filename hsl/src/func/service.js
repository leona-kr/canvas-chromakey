class Service {
  start() {
    console.log("start button click");
  }

  connect() {
    const pns = {
      address: "stpush.startsupport.com",
      port: 443
    }
    const stun = {
      address: "rtcst.113366.io",
      port: 443
    };
    const option = {
      iceServers: [
        {
          "urls": "stun:" + stun.address + ":" + stun.port + "?transport=tcp"
          // "username": userId,
          // "credential": password
        }
      ],
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      iceCandidatePoolSize: 0
    };
    const peer = RTCPeerConnection(option);

    const _icestatechange = (event) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState
      console.log("ice state change >> ", peer.iceConnectionState);

      // new | checking | connected | completed | failed | disconnected | closed
    };
    const _icecandidate = (event) => {
      // https://developer.mozilla.org/ko/docs/Web/API/RTCPeerConnection/onicecandidate
      if (event.candidate) {
        // event.candidate가 존재하면 원격 유저에게 candidate를 전달합니다.
      } else {
        // 모든 ICE candidate가 원격 유저에게 전달된 조건에서 실행됩니다.
        // candidate = null
      }
    };
    const _ontrack = (event) => {
      // https://developer.mozilla.org/ko/docs/Web/API/RTCPeerConnection/ontrack
      // 비디오 소스 event.streams[0]
    };

    
    peer.oniceconnectionstatechange = _icestatechange;
    peer.onicecandidate = _icecandidate;
    peer.ontrack = _ontrack;

    // peer.createOffer
    // peer.setRemoteDescription
    // peer.setRemoteDescription
    // peer.addIceCandidate
  }
}

// 내부 테스트 용으로 turn 서버 안쓰려고
// stun server
// stpush.startsupport.com
const service = new Service();
export default service;