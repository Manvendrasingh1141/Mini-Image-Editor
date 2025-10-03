const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("import_btn");
const filters = ["brightness", "contrast", "saturation", "grayscale"];
let img = new Image();
let cropMode = false;
let cropRect = null;
let history = [];


function saveState() {
  history.push(canvas.toDataURL());
}


function drawImage() {
  ctx.filter = `
    brightness(${document.getElementById("brightness").value}%)
    contrast(${document.getElementById("contrast").value}%)
    saturate(${document.getElementById("saturation").value}%)
    grayscale(${document.getElementById("grayscale").value}%)
  `;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (cropRect) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.setLineDash([6]);
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    ctx.setLineDash([]);
  }
}


upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    img.src = e.target.result;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawImage();
      saveState(); 
    };
  };
  reader.readAsDataURL(file);
});


filters.forEach((f) => {
  const slider = document.getElementById(f);
  slider.addEventListener("input", drawImage);
  slider.addEventListener("change", saveState); 
});


document.getElementById("reset").onclick = () => {
  document.getElementById("brightness").value = 100;
  document.getElementById("contrast").value = 100;
  document.getElementById("saturation").value = 100;
  document.getElementById("grayscale").value = 0;
  cropRect = null;
  drawImage();
  saveState();
};


document.getElementById("download").onclick = () => {
  const link = document.createElement("a");
  link.download = "edited.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};


document.getElementById("startCrop").onclick = () => {
  cropMode = true;
  cropRect = null;
};


canvas.addEventListener("mousedown", (e) => {
  if (!cropMode) return;
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;

  cropRect = { x: dx, y: dy, w: 0, h: 0 };

  function move(ev) {
    cropRect.w = ev.clientX - rect.left - dx;
    cropRect.h = ev.clientY - rect.top - dy;
    drawImage();
  }

  function up() {
    canvas.removeEventListener("mousemove", move);
    canvas.removeEventListener("mouseup", up);
  }

  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", up);
});


document.getElementById("applyCrop").onclick = () => {
  if (!cropRect) return;
  let { x, y, w, h } = cropRect;


  if (w < 0) {
    x += w;
    w = Math.abs(w);
  }
  if (h < 0) {
    y += h;
    h = Math.abs(h);
  }

  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  temp.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);

  img.src = temp.toDataURL();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    drawImage();
    saveState();
  };

  cropRect = null;
  cropMode = false;
};


document.getElementById("undo").onclick = () => {
  if (history.length > 1) {
    history.pop(); 
    const prev = history[history.length - 1];
    img.src = prev;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawImage();
    };
  }
};
