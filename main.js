// Cấu hình (Thay App ID của bạn vào đây)
const config = {
    appId: "MÃ_APP_ID_CỦA_BẠN", // <--- NHỚ DÁN APP ID VÀO ĐÂY
    channel: "zalo-demo",
    token: null
};

// Biến toàn cục lưu trạng thái
let rtc = {
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
};

let isMicOn = true;
let isCamOn = true;

// 1. Khởi tạo Client
rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// 2. Chức năng: THAM GIA (JOIN)
document.getElementById("join-btn").onclick = async function () {
    try {
        // Tham gia vào phòng
        await rtc.client.join(config.appId, config.channel, config.token, null);
        
        // Tạo Audio và Video từ máy mình
        rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

        // Hiển thị video của mình lên giao diện
        rtc.localVideoTrack.play("local-player");

        // Phát tín hiệu cho người khác thấy
        await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

        console.log("Đã tham gia thành công!");
        
        // Cập nhật giao diện nút bấm
        toggleButtons(true); 

    } catch (error) {
        console.error("Lỗi khi tham gia:", error);
    }
};

// 3. Chức năng: RỜI KHỎI (LEAVE)
document.getElementById("leave-btn").onclick = async function () {
    // Dừng phát và đóng thiết bị
    if(rtc.localAudioTrack) { rtc.localAudioTrack.close(); }
    if(rtc.localVideoTrack) { rtc.localVideoTrack.close(); }

    // Rời phòng
    await rtc.client.leave();
    
    // Xóa hình ảnh trên màn hình
    document.getElementById("local-player").innerHTML = '<div class="user-label">Bạn (Tôi)</div>';
    document.getElementById("remote-player").innerHTML = '<div class="user-label">Người bên kia</div>';
    
    // Cập nhật giao diện nút bấm
    toggleButtons(false);
    console.log("Đã rời cuộc gọi.");
};

// 4. Chức năng: BẬT/TẮT MIC
document.getElementById("mic-btn").onclick = async function () {
    if (!rtc.localAudioTrack) return;

    isMicOn = !isMicOn; // Đảo ngược trạng thái
    await rtc.localAudioTrack.setEnabled(isMicOn); // Lệnh tắt/mở mic thực sự

    // Đổi màu và chữ trên nút
    const btn = document.getElementById("mic-btn");
    if (isMicOn) {
        btn.innerText = "🎙️ Mic: Bật";
        btn.className = "btn-active";
    } else {
        btn.innerText = "🔇 Mic: Tắt";
        btn.className = "btn-off";
    }
};

// 5. Chức năng: BẬT/TẮT CAMERA
document.getElementById("cam-btn").onclick = async function () {
    if (!rtc.localVideoTrack) return;

    isCamOn = !isCamOn; // Đảo ngược trạng thái
    await rtc.localVideoTrack.setEnabled(isCamOn); // Lệnh tắt/mở cam thực sự

    // Đổi màu và chữ trên nút
    const btn = document.getElementById("cam-btn");
    if (isCamOn) {
        btn.innerText = "📷 Cam: Bật";
        btn.className = "btn-active";
    } else {
        btn.innerText = "🚫 Cam: Tắt";
        btn.className = "btn-off";
    }
};

// 6. Xử lý khi có NGƯỜI KHÁC tham gia/rời đi
rtc.client.on("user-published", async (user, mediaType) => {
    // Subscribe (đăng ký nhận) hình/tiếng của họ
    await rtc.client.subscribe(user, mediaType);

    if (mediaType === "video") {
        // Nếu là hình ảnh -> Chiếu vào khung remote-player
        user.videoTrack.play("remote-player");
    }
    if (mediaType === "audio") {
        // Nếu là âm thanh -> Phát tiếng
        user.audioTrack.play();
    }
});

rtc.client.on("user-unpublished", (user) => {
    // Khi họ tắt cam hoặc rời đi -> Xóa hình
    const remotePlayerContainer = document.getElementById("remote-player");
    // Giữ lại cái nhãn tên, chỉ xóa video
    remotePlayerContainer.innerHTML = '<div class="user-label">Người bên kia</div>'; 
});


// HÀM PHỤ TRỢ: Quản lý ẩn hiện nút
function toggleButtons(joined) {
    document.getElementById("join-btn").disabled = joined;
    document.getElementById("leave-btn").disabled = !joined;
    document.getElementById("mic-btn").disabled = !joined;
    document.getElementById("cam-btn").disabled = !joined;
    
    // Nếu rời đi thì reset trạng thái nút về mặc định
    if (!joined) {
        document.getElementById("join-btn").style.backgroundColor = "#0068ff";
        isMicOn = true; isCamOn = true;
        document.getElementById("mic-btn").innerText = "🎙️ Mic: Bật";
        document.getElementById("mic-btn").className = "btn-active";
        document.getElementById("cam-btn").innerText = "📷 Cam: Bật";
        document.getElementById("cam-btn").className = "btn-active";
    } else {
        document.getElementById("join-btn").style.backgroundColor = "#ccc";
    }
}