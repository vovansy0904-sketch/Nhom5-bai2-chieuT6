let options = {
    appId: "MÃ_APP_ID_CỦA_BẠN",
    channel: "lop-hoc-demo",
    token: null, // Để null nếu dùng Testing Mode
};

let rtc = {
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
};

async function joinCall() {
    rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Tham gia channel
    await rtc.client.join(options.appId, options.channel, options.token);

    // Tạo mic và camera
    rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

    // Phát video của mình lên màn hình
    rtc.localVideoTrack.play("local-player");

    // Đẩy tín hiệu lên server
    await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

    // Lắng nghe khi có người khác vào
    rtc.client.on("user-published", async (user, mediaType) => {
        await rtc.client.subscribe(user, mediaType);
        if (mediaType === "video") {
            user.videoTrack.play("remote-player");
        }
    });
}

document.getElementById("join-btn").onclick = joinCall;