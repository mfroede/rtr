// Required TDL modules.
tdl.require('tdl.programs');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.textures');

// Loads all shader programs from the DOM and return them in an array.
function createProgramsFromTags() {
   var vs = $('script[id^="vs"]');
   var fs = $('script[id^="fs"]');
   var programs = [];
   for ( var i = 0; i != vs.length; i++)
      programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text)
   return programs;
}

window.onload = function() {
   $(window).resize();
   try {
      initialize();
   } catch (e) {
      $('#error').text(e.message || e);
      $('#error').css('display', 'block');
   }
}

// Recalculate per face normals for a triangle mesh.
function perFaceNormals(arrays) {
   var n = arrays.indices.numElements;
   var idx = arrays.indices;
   var pos = arrays.position;
   var nrm = arrays.normal;
   for ( var ti = 0; ti != n; ti++) {
      var i = idx.getElement(ti);
      var normal = nrm.getElement(i[0]);
      nrm.setElement(i[1], normal);
      nrm.setElement(i[2], normal);
   }
   return arrays;
};

function StringToVec3(string, defaulColor) {
   if (!string.match(/-?([0-9]*)\s*,\s*-?([0-9]*)\s*,\s*-?([0-9]*)\s?/)) {
      return defaulColor;
   }
   var arr = string.split(',');
   var x = arr[0].trim() / 255.0;
   var y = arr[1].trim() / 255.0;
   var z = arr[2].trim() / 255.0;
   return vec3.create([ x, y, z ]);
};

// The main entry point.
function initialize() {
   // Setup the canvas widget for WebGL.
   window.canvas = document.getElementById("canvas");
   window.gl = tdl.webgl.setupWebGL(canvas);

   // Create the shader programs.
   var programs = createProgramsFromTags();
   
   var mouseDown = false;
   var lastMouseX = null;
   var lastMouseY = null;

   var moonRotationMatrix = mat4.create();
   mat4.identity(moonRotationMatrix);
   window.canvas.onmousedown = handleMouseDown;
   document.onmouseup = handleMouseUp;
   document.onmousemove = handleMouseMove;
   
   // Load textures.
   var textures = {
         env: tdl.textures.loadTexture([
             "textures/PalmTrees/posx.jpg",
             "textures/PalmTrees/negx.jpg",
             "textures/PalmTrees/posy.jpg",
             "textures/PalmTrees/negy.jpg",
             "textures/PalmTrees/posz.jpg",
             "textures/PalmTrees/negz.jpg" ])
     };

   var frag = window.location.hash.substring(1);
   var pnum = frag ? parseInt(frag) : 0;

   var edgelength = document.getElementById("cubelength").value == 0 ? 0.7
         : document.getElementById("cubelength").value;

   var torus = new tdl.models.Model(programs[pnum], tdl.primitives.createTorus(0.3, 0.15, 60, 60), textures);
   var circleTexture = false;
   var lightPositions = [];
   var lightIntensities = [];
   var readLights = function() {
      function stringToArray(string, defaulted) {
         if (!string.match(/-?([0-9]*)\s*,\s*-?([0-9]*)\s*,\s*-?([0-9]*)\s?/)) {
            return [ 1, 1, 1 ];
         }
         var arr = string.split(',');
         var x = arr[0].trim();
         var y = arr[1].trim();
         var z = arr[2].trim();
         return [ x, y, z ];
      }
      ;

      lights = [];
      for ( var i = 0; i < 4; i++) {
         if (document.getElementById("light_" + i).checked) {
            var x = document.getElementById("light_" + i + "_x").value;
            var y = document.getElementById("light_" + i + "_y").value;
            var z = document.getElementById("light_" + i + "_z").value;
            lights.push(new Light([ x, y, z ], stringToArray(document.getElementById("light_" + i + "_i").value)));
         }
      }
      lightPositions = createLightPositions(lights);
      lightIntensities = createLightIntensities(lights);
   }

   readLights();

   for ( var i = 0; i < 4; i++) {
      document.getElementById("light_" + i).onchange = readLights;
      document.getElementById("light_" + i + "_x").onchange = readLights;
      document.getElementById("light_" + i + "_y").onchange = readLights;
      document.getElementById("light_" + i + "_z").onchange = readLights;
      document.getElementById("light_" + i + "_i").onchange = readLights;
   }

   var changeCircleTexture = function() {
      torusConst.radius = document.getElementById("circleradius").value == 0 ? radius : document
            .getElementById("circleradius").value;
      torusConst.number = document.getElementById("circlenumber").value == 0 ? number : document
            .getElementById("circlenumber").value;
      torusConst.circleColor = StringToVec3(document.getElementById("circlecolor").value, circleColor);
      torusConst.backround = StringToVec3(document.getElementById("cubecolor").value, backround);
      torusConst.circleTexture = circleTexture;
   };

   document.getElementById("circlenumber").onchange = changeCircleTexture;
   document.getElementById("circleradius").onchange = changeCircleTexture;
   document.getElementById("circlecolor").onchange = changeCircleTexture;
   document.getElementById("cubecolor").onchange = changeCircleTexture;

   // Register a keypress-handler for shader program switching using the number
   // keys.
   window.onkeypress = function(event) {
      var n = String.fromCharCode(event.which);
      if (n == "s") {
         animate = !animate;
      } else if (n == "y") {
         torus.setBuffers(tdl.primitives.createCube(edgelength), textures);
      } else if (n == "x") {
         torus.setBuffers(tdl.primitives.createTorus(0.3, 0.15, 60, 60), textures);
      } else if (n == "c") {
         torus.setBuffers(tdl.primitives.createSphere(0.4, 60, 60), textures);
      } else if (n == "a") {
         circleTexture = !circleTexture;
         changeCircleTexture();
      } else if (n == "q") {
         torus.setProgram(programs[0]);
      } else if (n == "w") {
         torus.setProgram(programs[1]);
      } else if (n == "e") {
         torus.setProgram(programs[2]);
      } else if (n == "r") {
         torus.setProgram(programs[3]);
      } else if (n == "t") {
         torus.setProgram(programs[4]);
      } else if (n == "z") {
         torus.setProgram(programs[5]);
      } else if (n == "u") {
         torus.setProgram(programs[6]);
      }
   };

   // Create some matrices and vectors now to save time later.
   var projection = mat4.create();
   var view = mat4.create();
   var model = mat4.create();

   // Uniforms for lighting.
   var color = vec3.create();
   var lights = [];

   var eyePosition = vec3.create();
   var target = vec3.create();
   var up = vec3.create([ 0, 1, 0 ]);

   // Animation parameters for the rotating eye-point.
   var eyeSpeed = 0.2;
   var eyeHeight = 3;
   var eyeRadius = 3.5;
   var animate = false;

   // Animation needs accurate timing information.
   var elapsedTime = 0.0;
   var then = 0.0;
   var clock = 0.0;

   var radius = document.getElementById("circleradius").value;
   var number = document.getElementById("circlenumber").value;
   var circleColor = StringToVec3(document.getElementById("circlecolor").value, circleColor);
   var backround = StringToVec3(document.getElementById("cubecolor").value, backround);

   // Uniform variables that are the same for all torus in one frame.
   var torusConst = {
      view : view,
      projection : projection,
      eyePosition : eyePosition,
      lightPositions : lightPositions,
      lightIntensities : lightIntensities,
      time : clock,
      radius : radius,
      number : number,
      circleColor : circleColor,
      backround : backround,
      circleTexture : circleTexture
   };

   // Uniform variables that change for each torus in a frame.
   var torusPer = {
      model : model,
      color : color
   };

   // Renders one frame and registers itself for the next frame.
   function render() {
      tdl.webgl.requestAnimationFrame(render, canvas);

      torusConst.lightPositions = new Float32Array(lightPositions);
      torusConst.lightIntensities = new Float32Array(lightIntensities);

      // Do the time keeping.
      var now = (new Date()).getTime() * 0.001;
      elapsedTime = (then == 0.0 ? 0.0 : now - then);
      then = now;
      if (animate) {
         clock += elapsedTime;
      }

      // Calculate the current eye position.
      eyePosition[0] = Math.sin(clock * eyeSpeed) * eyeRadius;
      eyePosition[1] = eyeHeight;
      eyePosition[2] = Math.cos(clock * eyeSpeed) * eyeRadius;

      // Setup global WebGL rendering behavior.
      gl.enable(gl.BLEND);
      gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
      gl.colorMask(true, true, true, true);
      gl.depthMask(true);
      gl.clearColor(0.5, 0.5, 0.5, 1);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);

      // Calculate the perspective projection matrix.
      mat4.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 10, projection);

      // Calculate the viewing transfomation.
      mat4.lookAt(eyePosition, target, up, view);

      // Prepare rendering of toruss.
      torusConst.time = clock;
      torus.drawPrep(torusConst);

      var across = 3;
      var half = (across - 1) / 2.0;

      mat4.translate(mat4.identity(torusPer.model), [ 0, 0, 0 ]);
      mat4.scale(torusPer.model, [ 3.0, 3.0, 3.0 ]);
      mat4.multiply(torusPer.model, moonRotationMatrix);
      torusPer.color[0] = 1;
      torusPer.color[1] = 0;
      torusPer.color[2] = 0;

      // Actually render one torus.
      torus.draw(torusPer);
   }

   function setUpLights() {
      lights = [];
      for ( var i = 0; i < 4; i++) {
         if (document.getElementById("light_" + i).checked) {
            var x = document.getElementById("light_" + i + "_x").value;
            var y = document.getElementById("light_" + i + "_y").value;
            var z = document.getElementById("light_" + i + "_z").value;
            lights.push(new Light([ x, y, z ], stringToArray(document.getElementById("light_" + i + "_i").value)));
         }
      }
      return lights;
   }

   // Initial call to get the rendering started.
   render();
   
   function handleMouseDown(event) {
     mouseDown = true;
     lastMouseX = event.clientX;
     lastMouseY = event.clientY;
   }

   function handleMouseUp(event) {
     mouseDown = false;
   }

   function handleMouseMove(event) {
     if (!mouseDown) {
       return;
     }
     var newX = event.clientX;
     var newY = event.clientY;

     var deltaX = newX - lastMouseX;
     var newRotationMatrix = mat4.create();
     mat4.identity(newRotationMatrix);
     mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

     var deltaY = newY - lastMouseY;
     mat4.rotate(newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

     mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);

     lastMouseX = newX
     lastMouseY = newY;
   }
   
   function degToRad(degrees) {
      return degrees * Math.PI / 100;
   }
}
