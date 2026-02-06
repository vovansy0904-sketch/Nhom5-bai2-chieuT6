// CẤU HÌNH (Thay App ID của bạn vào đây)
const APP_ID = "85956f6d98a2458e8c08946b6299beca"; // <--- Dán App ID vào đây
const CHANNEL = "Video Call";
const TOKEN = null;

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localTracks = {
    audioTrack: null,
    videoTrack: null
};

let localName = "Tôi";
let isMicOn = true;
let isCamOn = true;

// --- PHẦN 1: XỬ LÝ NÚT BẤM ---

// Nút VÀO PHÒNG
document.getElementById("join-btn").onclick = async () => {
    const inputName = document.getElementById("username-input").value;
    if (!inputName) {
        alert("Vui lòng nhập tên!");
        return;
    }
    localName = inputName;
    
    // Ẩn màn hình nhập, hiện giao diện gọi
    document.getElementById("join-screen").style.display = "none";
    document.getElementById("controls").style.display = "flex";

    await joinStream();
};

// Nút MIC
document.getElementById("mic-btn").onclick = async () => {
    if (!localTracks.audioTrack) return;
    isMicOn = !isMicOn;
    await localTracks.audioTrack.setEnabled(isMicOn);
    // Đổi màu nút
    document.getElementById("mic-btn").className = isMicOn ? "btn-control" : "btn-control btn-off";
    document.getElementById("mic-btn").innerHTML = isMicOn ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
};

// Nút CAM
document.getElementById("cam-btn").onclick = async () => {
    if (!localTracks.videoTrack) return;
    isCamOn = !isCamOn;
    await localTracks.videoTrack.setEnabled(isCamOn);
    // Đổi màu nút
    document.getElementById("cam-btn").className = isCamOn ? "btn-control" : "btn-control btn-off";
    document.getElementById("cam-btn").innerHTML = isCamOn ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
};

// Nút RỜI KHỎI
document.getElementById("leave-btn").onclick = async () => {
    // Đóng tracks
    for (let trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = null;
        }
    }
    // Rời phòng Agora
    await client.leave();
    
    // Xóa hết video trên màn hình
    document.getElementById("video-grid").innerHTML = "";
    
    // Hiện lại màn hình chờ
    document.getElementById("controls").style.display = "none";
    document.getElementById("join-screen").style.display = "flex";
};


// --- PHẦN 2: LOGIC GỌI VIDEO ---

async function joinStream() {
    // Sự kiện khi có người khác tham gia
    client.on("user-published", handleUserJoined);
    client.on("user-unpublished", handleUserLeft);

    // Join vào kênh (UID để null để Agora tự sinh số ngẫu nhiên)
    const uid = await client.join(APP_ID, CHANNEL, TOKEN, null);

    // Tạo Mic và Cam local
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();

    // Hiển thị video của chính mình
    createVideoContainer(uid, localName, localTracks.videoTrack);

    // Phát tín hiệu lên server
    await client.publish(Object.values(localTracks));
}

// Hàm hiển thị video (dùng chung cho cả mình và người khác)
function createVideoContainer(uid, name, track) {
    // Tạo khung thẻ DIV
    const wrapper = document.createElement("div");
    wrapper.id = `user-container-${uid}`;
    wrapper.className = "video-card";
    
    // Tạo nhãn tên
    const nameLabel = document.createElement("div");
    nameLabel.className = "user-name";
    nameLabel.innerText = name;
    wrapper.appendChild(nameLabel);

    // Thêm vào lưới
    document.getElementById("video-grid").appendChild(wrapper);

    // Play video vào trong khung vừa tạo
    track.play(wrapper);
}

// Khi người khác tham gia
async function handleUserJoined(user, mediaType) {
    await client.subscribe(user, mediaType);

    if (mediaType === "video") {
        // Kiểm tra xem đã có khung người này chưa, nếu chưa thì tạo
        if (!document.getElementById(`user-container-${user.uid}`)) {
            // Vì không có Server lưu tên, ta tạm hiển thị ID của họ
            createVideoContainer(user.uid, `Người dùng ${user.uid}`, user.videoTrack);
        }
    }

    if (mediaType === "audio") {
        user.audioTrack.play();
    }
}

// Khi người khác rời đi
function handleUserLeft(user) {
    const wrapper = document.getElementById(`user-container-${user.uid}`);
    if (wrapper) {
        wrapper.remove(); // Xóa div khỏi màn hình
    }
}