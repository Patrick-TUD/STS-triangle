window.addEventListener('load', () =>{
  console.log('Hello v2.')
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext('2d');
  
  // Resizing
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Example shapes
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 5;
  ctx.fillRect(20, 20, 20, 80);
  
  ctx.beginPath();
  ctx.moveTo(100,100);
  ctx.lineTo(123,321);
  ctx.lineTo(123,120);
  ctx.closePath();
  ctx.stroke();
  
  // Variables
  let dragging = false;
  
  // Functions
  function startPosition(){
    dragging = true;
  }
  
  function finishedPosition(){
    dragging = false;
  }
  
  function drag(e){
    if(!dragging) return;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  }
  
  // EventListeners
  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', finishedPosition);
  canvas.addEventListener('mousemove', drag);
});
