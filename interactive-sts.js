window.addEventListener('load', () =>{
  console.log('Hello v2.')
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext('2d');
  
  // Resizing
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx.fillRect(20, 20, 20, 80);
});
