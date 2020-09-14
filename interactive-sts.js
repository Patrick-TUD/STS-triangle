const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext('2d');

let canvas_top = 175;
let center_width = null;
let center_height = null;
let triangle_side_length = 250;

const paramgraphs = [];
let graph_h_spacing = 50;
let graph_v_spacing = Math.floor(2*canvas.height/6);
let parameter_graph_count = 22;
let parameter_graphs_per_line = parameter_graph_count/2;

let parameter_description = "";
let parameter_description_col = "black";
let parameter_description_xpos = center_width;
let parameter_description_ypos = null;

const graph_properties = [];
// [0; color, 1; name, 2; base value, 3; social factor, 4; technology factor, 5; service factor, description]
graph_properties[0] = ["darkolivegreen", "K_GOAL", 0.4, 0, 0.3, 0.3, "Goal force strength factor."];
graph_properties[1] = ["darkolivegreen", "A_PED", 0, 0.8, 0.2, 0, "Pedestrian force strength factor."];
graph_properties[2] = ["darkolivegreen", "B_PED", 0, 0.6, 0.3, 0.1, "Pedestrian force range factor."];
graph_properties[3] = ["darkolivegreen", "A_OBS", 0.5, -0.4, 0.2, 0.3, "Obstacle force strength factor."];
graph_properties[4] = ["darkolivegreen", "B_OBS", 0.5, -0.4, 0.3, 0.2, "Obstacle force range factor."];
graph_properties[5] = ["darkolivegreen", "L", 0.2, 0.8, -0.1, -0.1, "Lambda; strength of the anisotropic factor."];
graph_properties[6] = ["orange", "HORIZON", 0.5, 0.5, -0.1, -0.1, "Length of the forward simulation horizon."];
graph_properties[7] = ["orange", "TIME_STEP", 0.5, 0.5, -0.3, -0.2, "Number of seconds during each iteration in the horizon."];
graph_properties[8] = ["orange", "POLICY_ELECTION_CYCLE", 1, -0.1, -0.8, -0.8, "Select new policy every # TIME_STEPS."];
graph_properties[9] = ["orange", "ALPHA", 0.5, -0.5, 0.5, 0, "The 'progress' weight factor for the MPDM cost function."];
graph_properties[10] = ["orange", "MIN_FOLLOW_DISTANCE", 0.4, 0.6, 0, 0, "Minimum distance to the leader during the follow policy."];
graph_properties[11] = ["purple", "V_MAX", 0.6, -0.3, -0.2, 0.4, "Maximum velocity of the robot."];
graph_properties[12] = ["steelblue", "PASS_LENGTH", 0, 0.8, 0.1, 0.1, "Length of the sensing area for frontal passing."];
graph_properties[13] = ["steelblue", "PASS_WIDTH", 0.2, 0.6, 0.1, 0.1, "Width of the sensing area for frontal passing."];
graph_properties[14] = ["steelblue", "PASS_STRENGTH", 0.3, 0.6, 0.1, 0.1, "Passing force strength factor."];
graph_properties[15] = ["steelblue", "PASS_ANGLE_BIAS", 0.5, 0.4, 0.1, 0.1, "Right hand rule bias in passing."];
graph_properties[16] = ["steelblue", "PASS_FACING_ANGLE_MARGIN", 0.7, 0.3, -0.2, -0.2, "Angle the other agent's 'look' can deviate for frontal passing."];
graph_properties[17] = ["darkred", "CROSS_LENGTH", 0.3, 0.7, -0.3, -0.3, "Length of the sensing cone for crossing."];
graph_properties[18] = ["darkred", "CROSS_DEGS", 0.5, 0.5, -0.2, 0.2, "Angle of the sensing cone, centered on robots heading."];
graph_properties[19] = ["darkred", "CROSS_SLOW_STRENGTH", 0.6, 0.4, -0.4, -0.4, "Speed reduction force factor for pedestrian crossing."];
graph_properties[20] = ["darkred", "CROSS_SIDE_STRENGTH", 0.7, 0.3, -0.2, -0.2, "Side stepping force factor for pedestrian crossing."];
graph_properties[21] = ["darkred", "CROSS_FACING_ANGLE_MARGIN", 0.7, 0.3, -0.1, -0.1, "Angle the other agent's 'look' can deviate for pedestrian crossing."];

// ########### TOOLBOX FUNCTIONS ################
function point_in_triangle(px,py,ax,ay,bx,by,cx,cy){
  //credit: http://www.blackpawn.com/texts/pointinpoly/default.html

  var v0 = [cx-ax,cy-ay];
  var v1 = [bx-ax,by-ay];
  var v2 = [px-ax,py-ay];

  var dot00 = (v0[0]*v0[0]) + (v0[1]*v0[1]);
  var dot01 = (v0[0]*v1[0]) + (v0[1]*v1[1]);
  var dot02 = (v0[0]*v2[0]) + (v0[1]*v2[1]);
  var dot11 = (v1[0]*v1[0]) + (v1[1]*v1[1]);
  var dot12 = (v1[0]*v2[0]) + (v1[1]*v2[1]);

  var invDenom = 1/ (dot00 * dot11 - dot01 * dot01);

  var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  return ((u >= 0) && (v >= 0) && (u + v < 1));
}

//credit: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
// function distToSegmentSquared(p, v, w) {
//   var l2 = dist2(v, w);
//   if (l2 == 0) return dist2(p, v);
//   var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
//   t = Math.max(0, Math.min(1, t));
//   return dist2(p, { x: v.x + t * (w.x - v.x),
//                     y: v.y + t * (w.y - v.y) });
// }
// function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
function distToSegment(p, v, w) { return Math.sqrt(dist2(p, pointOnLine(p, v, w))); }

function pointOnLine(p, v, w){
  var l2 = dist2(v, w); // Calculate squared length of line segment
  if (l2 == 0) return v;  // Squared length = 0? Point on line is one of the endpoints.
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;   // Calculate length t along line closest to point p.
  t = Math.max(0, Math.min(1, t));  // Limit to the line segment endpoints.
  return {  x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y) }; // Return the point on the line segment closest to point p.
}

function distance_to_line(px, py, ax, ay, bx, by){
  return distToSegment({x: px, y: py}, {x: ax, y: ay}, {x: bx, y: by});
}
function map( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
// ########### END OF TOOLBOX FUNCTIONS ################



function resizeCanvas(){
  // Resizing
  canvas.width = Math.max(window.innerWidth-5, 1000);
  canvas.height = Math.max(Math.floor(window.innerHeight-200), 500);
  center_width = Math.floor(canvas.width / 2);
  center_height = Math.floor(canvas.height / 2);
  
  graph_h_spacing = 50;
  graph_v_spacing = Math.floor(2*canvas.height/6);

  for (let i=0; i<paramgraphs.length; i++){
    paramgraphs[i].xpos = Math.floor(canvas.width/2)-40+i*graph_h_spacing - Math.floor(i/parameter_graphs_per_line)*parameter_graphs_per_line*graph_h_spacing;
    paramgraphs[i].ypos = Math.floor(canvas.height/3) + Math.floor(i/parameter_graphs_per_line)*graph_v_spacing;
  }

  parameter_description_xpos = Math.floor(canvas.width/2)-40+Math.floor(parameter_graphs_per_line/2) * graph_h_spacing;
  parameter_description_ypos = Math.floor(canvas.height/3)-128;

  updateCanvas();
}

window.addEventListener('load', init)

function init(){
  // canvas.style.position = 'absolute';
  canvas.style.top = `${canvas_top}px`;

  for (let i = 0; i < parameter_graph_count; i++){
    paramgraphs.push(new ParamGraph(graph_properties[i][1], 0, 0, graph_properties[i][0], graph_properties[i][2], graph_properties[i][3], graph_properties[i][4], graph_properties[i][5], graph_properties[i][6]));
  }

  resizeCanvas();
};

let mouse_x = null;
let mouse_y = null;
let marker_x = null;
let marker_y = null;
let height = null;
let triangle_center = null;
let triangle_base_height = null;
let ax = null;
let ay = null;
let bx = null;
let by = null;
let cx = null;
let cy = null;

let technology_dis = 0.333;
let social_dis = 0.333;
let service_dis = 0.333;

// Example shapes
// ctx.strokeStyle = "blue";
// ctx.lineWidth = 5;
// ctx.fillRect(20, 20, 20, 80);

// ctx.beginPath();
// ctx.moveTo(100,100);
// ctx.lineTo(123,321);
// ctx.lineTo(123,120);
// ctx.closePath();
// ctx.stroke();
// ctx.beginPath();

// Variables
let dragging = false;

// Functions
function startPosition(e){
  dragging = true;
  drag(e)
}

function finishedPosition(){
  dragging = false;
  ctx.beginPath();
}

function drag(e){
  if(!dragging){
    // Check if mouse is hovering over an parameter, if so provide a description, otherwise clear the description.
    let mouse_x_info = e.clientX;
    let mouse_y_info = e.clientY-canvas_top;
    let flag = false;
    for (let i=0; i<paramgraphs.length; i++){
      // 1. Check if mouse is within bounding box.
      if (paramgraphs[i].pointInBoundingBox(mouse_x_info, mouse_y_info)){
        // console.log(i);
        // 2. Set descriptive text to own description.
        parameter_description = paramgraphs[i].description;
        parameter_description_col = paramgraphs[i].color;
        // 3. if found, return.
        flag = true;
      }
    }
    // 4. No return? Clear the description.
    if (!flag){parameter_description = ""};
  }else{
    // Update mouse position in triangle and calculate new aspect and parameter values. 
    mouse_x = e.clientX;
    mouse_y = e.clientY-canvas_top;
    if (point_in_triangle( mouse_x, mouse_y, ax, ay, bx, by, cx, cy)){
      // console.log(distance_to_line(mouse_x, mouse_y, ax, ay, bx, by));
      // Point within triangle, marker position is mouse position;
      marker_x = mouse_x;
      marker_y = mouse_y;
    }else{
      // Point outside triangle, marker position is closest point to mouse position while within triangle.
      let marker = pointOnLine({x: mouse_x, y: mouse_y}, {x: ax, y: ay}, {x: bx, y: by});
      if (dist2(marker, {x: mouse_x, y: mouse_y}) > dist2(pointOnLine({x: mouse_x, y: mouse_y}, {x: bx, y: by}, {x: cx, y: cy}), {x: mouse_x, y: mouse_y})){
        marker = pointOnLine({x: mouse_x, y: mouse_y}, {x: bx, y: by}, {x: cx, y: cy});
      }
      if (dist2(marker, {x: mouse_x, y: mouse_y}) > dist2(pointOnLine({x: mouse_x, y: mouse_y}, {x: ax, y: ay}, {x: cx, y: cy}), {x: mouse_x, y: mouse_y})){
        marker = pointOnLine({x: mouse_x, y: mouse_y}, {x: ax, y: ay}, {x: cx, y: cy});
      }
      marker_x = marker.x;
      marker_y = marker.y;
    }
    technology_dis = distance_to_line(marker_x, marker_y, ax, ay, bx, by) / height;
    social_dis = distance_to_line(marker_x, marker_y, cx, cy, bx, by) / height;
    service_dis = distance_to_line(marker_x, marker_y, ax, ay, cx, cy) / height;
    updateParamValues();
  }
  updateCanvas();
}

// Update canvas
function updateCanvas(){
  clearCanvas();
  drawTriangle();
  drawSTSGraphs();
  drawParamGraphs();
  drawParameterDescription();
}

// Clear the canvas
function clearCanvas(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "aliceblue";
  ctx.fillRect(center_width-500, 20, 1000, canvas.height-40);
}

// Draw the STS triangle with corner annotations.
function drawTriangle(){
  height = triangle_side_length * Math.cos(Math.PI / 6);
  triangle_center = center_width - 300;
  triangle_base_height = center_height + 30;

  ax = triangle_center - triangle_side_length / 2;
  ay = triangle_base_height;
  bx = triangle_center + triangle_side_length / 2;
  by = triangle_base_height;
  cx = triangle_center;
  cy = triangle_base_height - height;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();

  // The fill color
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();

  // The outline
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#666666';
  ctx.stroke();

  // The corner names
  ctx.font = '20px "Arial"';
  ctx.fillStyle = "green";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillText("Social", ax - 10, ay+5);

  ctx.font = '20px "Arial"';
  ctx.fillStyle = "red";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillText("Service", bx + 10, by+5);

  ctx.font = '20px "Arial"';
  ctx.fillStyle = "blue";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Technology", cx, cy - 5);

  //Thin and light triangle base lines
  ctx.beginPath();
  ctx.moveTo(triangle_center, triangle_base_height);
  ctx.lineTo(cx, cy);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#DDDDDD';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(triangle_center + triangle_side_length / 4, triangle_base_height - height / 2);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(triangle_center - triangle_side_length / 4, triangle_base_height - height / 2);
  ctx.lineTo(bx, by);
  ctx.stroke();

  //Thin colored lines from input point to aspect edges and circle marker.
  if (marker_x != null){
    ctx.beginPath();
    ctx.moveTo(marker_x, marker_y);
    var p_service = pointOnLine({x: marker_x, y: marker_y}, {x: ax, y: ay}, {x: cx, y: cy});
    ctx.lineTo(p_service.x, p_service.y);
    ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(marker_x, marker_y);
    var p_social = pointOnLine({x: marker_x, y: marker_y}, {x: bx, y: by}, {x: cx, y: cy});
    ctx.lineTo(p_social.x, p_social.y);
    ctx.strokeStyle = "green";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(marker_x, marker_y);
    var p_technology = pointOnLine({x: marker_x, y: marker_y}, {x: bx, y: by}, {x: ax, y: ay});
    ctx.lineTo(p_technology.x, p_technology.y);
    ctx.strokeStyle = "blue";
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#888888';
    ctx.arc(marker_x, marker_y, 5, 0, Math.PI * 2, false);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // beginPath to make sure previous lines are decoupled from the next.
  ctx.beginPath();

}

function drawSTSGraphs(){
  let base_height = Math.floor(canvas.height / 2) + 220;
  let h_spacing = 100;
  let social_center = cx - h_spacing;
  let technology_center = cx;
  let service_center = cx + h_spacing;
  let bar_width = 20;
  let bar_height = 100;

  ctx.fillStyle = "#d9f2d9";
  ctx.fillRect(social_center-1, base_height-30-bar_height, 2, bar_height);
  ctx.fillStyle = "green";
  ctx.fillRect(social_center-bar_width/2, base_height-30-bar_height*social_dis, bar_width, bar_height*social_dis);
  ctx.fillStyle = "#CCCCFF";
  ctx.fillRect(technology_center-1, base_height-30-bar_height, 2, bar_height);
  ctx.fillStyle = "blue";
  ctx.fillRect(technology_center-bar_width/2, base_height-30-bar_height*technology_dis, bar_width, bar_height*technology_dis);
  ctx.fillStyle = "#FFCCCC";
  ctx.fillRect(service_center-1, base_height-30-bar_height, 2, bar_height);
  ctx.fillStyle = "red";
  ctx.fillRect(service_center-bar_width/2, base_height-30-bar_height*service_dis, bar_width, bar_height*service_dis);

  ctx.font = '16px "Arial"';
  ctx.fillStyle = "blue";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Technology", technology_center, base_height);
  ctx.fillText(technology_dis.toFixed(3), technology_center, base_height-40-bar_height*technology_dis);
  ctx.fillStyle = "red";
  ctx.fillText("Service", service_center, base_height);
  ctx.fillText(service_dis.toFixed(3), service_center, base_height-40-bar_height*service_dis);
  ctx.fillStyle = "green";
  ctx.fillText("Social", social_center, base_height);
  ctx.fillText(social_dis.toFixed(3), social_center, base_height-40-bar_height*social_dis);


}

function ParamGraph(name, xpos, ypos, color, base, social_val, technology_val, service_val, description){
  this.name = name;
  this.xpos = xpos;
  this.ypos = ypos;
  this.color = color
  this.bar_width = 20;
  this.bar_height = 100;
  this.value = 0.500;
  this.base = base;
  this.social_val = social_val;
  this.technology_val = technology_val;
  this.service_val = service_val;
  this.description = description;
  this.bounding_width = 25;
  this.bounding_height = this.bar_height*1.5;
  this.on_hover = false;

  this.draw = function(){
    // On hover debug
    if (this.on_hover){
      // let background_alpha = 0.5;
      ctx.fillStyle = "white";//`rgba(255, 255, 255, ${background_alpha})`;
      ctx.fillRect(this.xpos-this.bounding_width, this.ypos-this.bar_height-15, this.bounding_width*2, this.bounding_height+10);
    }

    // Param graph and info itself.
    ctx.font = '13px "Arial"';
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(this.xpos-1, this.ypos-this.bar_height, 2, this.bar_height);
    ctx.globalAlpha = 1;
    ctx.fillRect(this.xpos-this.bar_width/2, this.ypos-this.value*this.bar_height, this.bar_width, this.bar_height*this.value);
    ctx.save();
    ctx.translate(this.xpos+5, this.ypos+15);
    let angle_div = map(Math.min(canvas.height, 800), 500, 800, 10, 3);
    ctx.rotate(-Math.PI/angle_div);  // 10 at min height, 3 at max height
    ctx.textAlign = "right";
    // ctx.fillStyle = "blue";
    ctx.fillText(this.name, 0, 0);
    ctx.restore();
  }

  this.setPos = function(xpos, ypos){
    this.xpos = xpos;
    this.ypos = ypos;
  }

  this.updateValue = function(){
    this.value = this.base + social_dis*this.social_val + technology_dis*this.technology_val + service_dis*this.service_val;
  }

  this.pointInBoundingBox = function(point_x, point_y){
    this.on_hover = (point_x >= this.xpos-this.bounding_width && point_x < this.xpos+this.bounding_width && point_y >= this.ypos-this.bar_height-15 && point_y <= this.ypos-this.bar_height-5+this.bounding_height);
    return this.on_hover;
  }
}

function drawParamGraphs() {
  for (let i = 0; i < paramgraphs.length; i++){
    // console.log(i + " " + paramgraphs[i].value);
    // paramgraphs[i].value = Math.random();
    // console.log(i + " " + paramgraphs[i].value);
    // console.log(i + " " + paramgraphs[i].color);
    // paramgraphs[i].color = "blue";
    // console.log(i + " " + paramgraphs[i].color);

    paramgraphs[i].draw();
  }
}

function updateParamValues(){
  for (let i = 0; i < paramgraphs.length; i++){
    paramgraphs[i].updateValue();
  }
}

function drawParameterDescription() {
  ctx.font = '16px "Arial"';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // Rectangle below text.
  ctx.fillStyle = "white";
  let text_width = ctx.measureText(parameter_description).width+20;
  let text_height = 25;
  ctx.fillRect(parameter_description_xpos-Math.ceil(text_width/2), parameter_description_ypos-Math.floor(text_height/2)-3, Math.ceil(text_width), text_height);
  // Description text itself.
  ctx.fillStyle = parameter_description_col;
  ctx.fillText(parameter_description, parameter_description_xpos, parameter_description_ypos);
}

// EventListeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', drag);
window.addEventListener('resize', resizeCanvas);