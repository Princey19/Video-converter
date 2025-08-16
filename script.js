const videoInput = document.getElementById("videoInput");
const previewVideo = document.getElementById("previewVideo");
const toPortrait = document.getElementById("toPortrait");
const toLandscape = document.getElementById("toLandscape");
const downloadBtn = document.getElementById("downloadBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
let originalVideo;

videoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewVideo.src = url;
    originalVideo = document.createElement("video");
    originalVideo.src = url;
    originalVideo.crossOrigin = "anonymous";
    originalVideo.load();
  }
});

toPortrait.addEventListener("click", () => {
  if (originalVideo) convertVideo(originalVideo, "portrait");
});
toLandscape.addEventListener("click", () => {
  if (originalVideo) convertVideo(originalVideo, "landscape");
});

function convertVideo(video, orientation) {
  loadingOverlay.style.display = "block";

  let targetWidth, targetHeight;
  if (orientation === "portrait") {
    targetWidth = 720;
    targetHeight = 1280;
  } else {
    targetWidth = 1280;
    targetHeight = 720;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const aspectRatio = video.videoWidth / video.videoHeight;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (aspectRatio > targetWidth / targetHeight) {
    drawWidth = targetWidth;
    drawHeight = drawWidth / aspectRatio;
    offsetX = 0;
    offsetY = (targetHeight - drawHeight) / 2;
  } else {
    drawHeight = targetHeight;
    drawWidth = drawHeight * aspectRatio;
    offsetX = (targetWidth - drawWidth) / 2;
    offsetY = 0;
  }

  const canvasStream = canvas.captureStream();
  const audioTracks = video.captureStream().getAudioTracks();
  audioTracks.forEach((track) => canvasStream.addTrack(track));

  const recorder = new MediaRecorder(canvasStream);
  let chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    previewVideo.src = url;
    previewVideo.load();
    downloadBtn.style.display = "inline-block";
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-${orientation}.webm`;
      a.click();
    };
    loadingOverlay.style.display = "none";
  };

  recorder.start();

  const drawFrame = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    if (!video.paused && !video.ended) {
      requestAnimationFrame(drawFrame);
    }
  };

  video.play();
  drawFrame();
  video.onended = () => recorder.stop();
}
