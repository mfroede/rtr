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

function setupSkybox(SkyTextures, SkyProgram) {
   var arrays = tdl.primitives.createCube(15);
   tdl.primitives.reorientPositions(arrays.position, mat4.scale(mat4.identity([]), [-1, -1, -1]));

   return new tdl.models.Model(SkyProgram[0], arrays, SkyTextures);
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

   var objectRotationMatrix = mat4.create();
   mat4.identity(objectRotationMatrix);
   window.canvas.onmousedown = handleMouseDown;
   document.onmouseup = handleMouseUp;
   document.onmousemove = handleMouseMove;
   
   // Load textures.
   var texturename = ["PalmTrees","Teide","PiazzaDelPopolo2"];
   var texturenumber = 0;
   var bumpname = ["Water_normal.png","Industrial_Wall_normal.png"];
   var bumpnumber = 0;
   var textures = {
         env: tdl.textures.loadTexture([
             "textures/"+texturename[texturenumber]+"/posx.jpg",
             "textures/"+texturename[texturenumber]+"/negx.jpg",
             "textures/"+texturename[texturenumber]+"/posy.jpg",
             "textures/"+texturename[texturenumber]+"/negy.jpg",
             "textures/"+texturename[texturenumber]+"/posz.jpg",
             "textures/"+texturename[texturenumber]+"/negz.jpg" ]),
         bump: tdl.textures.loadTexture("textures/"+bumpname[bumpnumber]), 
     };

   var frag = window.location.hash.substring(1);
   var pnum = frag ? parseInt(frag) : 0;

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

   var eyePosition = vec3.create([0.0,0.0,-2.0]);
   var viewTransformMatrix = mat4.create();
   var target = vec3.create([0.0,0.0,1.0]);
   var up = vec3.create([0.0,1.0,0.0]);
   
   // Register a keypress-handler for shader program switching using the number
   // keys.
   window.onkeypress = function(event) {
      var key = String.fromCharCode(event.which);
      if (key == "e") {
    	  useBumps = !useBumps;
      } else if (key == "y") {
         torus.setBuffers(tdl.primitives.createCube(0.75), textures);
      } else if (key == "x") {
         torus.setBuffers(tdl.primitives.createTorus(0.3, 0.15, 60, 60), textures);
      } else if (key == "c") {
         torus.setBuffers(tdl.primitives.createSphere(0.45, 60, 60), textures);
      } else if (key == "w") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.translate(viewTransformMatrix, [0, 0, 0.5]);
    	  mat4.multiply(viewTransformMatrix, view, view);
      } else if (key == "a") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.translate(viewTransformMatrix, [-0.5, 0, 0]);
          mat4.multiply(viewTransformMatrix, view, view);
      } else if (key == "s") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.translate(viewTransformMatrix, [0, 0, -0.5]);
          mat4.multiply(viewTransformMatrix, view, view);
      } else if (key == "d") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.translate(viewTransformMatrix, [0.5, 0, 0]);
          mat4.multiply(viewTransformMatrix, view, view);
      } else if (key == "W") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.rotate(viewTransformMatrix, degToRad(-1), [1, 0, 0]);
          mat4.multiply(viewTransformMatrix, view, view);
          mat4.multiply(viewTransformMatrix, cloneView, cloneView);
      } else if (key == "S") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.rotate(viewTransformMatrix, degToRad(1), [1, 0, 0]);
    	  mat4.multiply(viewTransformMatrix, view, view);
          mat4.multiply(viewTransformMatrix, cloneView, cloneView);
      } else if (key == "A") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.rotate(viewTransformMatrix, degToRad(-1), [0, 1, 0]);
          mat4.multiply(viewTransformMatrix, view, view);
          mat4.multiply(viewTransformMatrix, cloneView, cloneView);
      } else if (key == "D") {
    	  mat4.identity(viewTransformMatrix);
    	  mat4.rotate(viewTransformMatrix, degToRad(1), [0, 1, 0]);
          mat4.multiply(viewTransformMatrix, view, view);
          mat4.multiply(viewTransformMatrix, cloneView, cloneView);
      }  else if (key == "o" || key == "p") {
    	  if(key == "o"){
    		  texturenumber = texturenumber < texturename.length - 1 ? ++texturenumber : 0;
    	  }
    	  if(key == "p"){
    		  bumpnumber = bumpnumber < bumpname.length - 1 ? ++bumpnumber : 0;
    	  }
    	  var textures = {
	         env: tdl.textures.loadTexture([
	             "textures/"+texturename[texturenumber]+"/posx.jpg",
	             "textures/"+texturename[texturenumber]+"/negx.jpg",
	             "textures/"+texturename[texturenumber]+"/posy.jpg",
	             "textures/"+texturename[texturenumber]+"/negy.jpg",
	             "textures/"+texturename[texturenumber]+"/posz.jpg",
	             "textures/"+texturename[texturenumber]+"/negz.jpg" ]),
	             bump: tdl.textures.loadTexture("textures/"+bumpname[bumpnumber]),
	     };
    	 torus.textures = textures;
    	 skybox.textures = textures;
      }
   };

   // Create some matrices and vectors now to save time later.
   var projection = mat4.create();
   var view = mat4.create();
   mat4.lookAt(eyePosition, target, up, view);
   var model = mat4.create();

   // Uniforms for lighting.
   var color = vec3.create([1.0,0.0,0.0]);
   var lights = [];

   // Animation parameters for the rotating eye-point.
   var eyeSpeed = 0.2;
   var eyeHeight = 0;
   var eyeRadius = 3.5;
   var animate = false;
   var useBumps = false;

   // Animation needs accurate timing information.
   var elapsedTime = 0.0;
   var then = 0.0;
   var clock = 0.0;
   
   var skybox = setupSkybox(textures, programs);

   // Uniform variables that are the same for all torus in one frame. 
   var torusConst = {
      view : view,
      projection : projection,
	  eyeCorection : 1.0,
      lightPositions : lightPositions,
      lightIntensities : lightIntensities,
      time : clock,
      skalar : 1.0,
      useBumps : useBumps
   };

   // Uniform variables that change for each torus in a frame.
   var torusPer = {
      model : model,
      color : color
   };
   
   var skymodel = mat4.create();
   var cloneView = mat4.create(view);
   var skyConst = {
	  view : cloneView,
	  eyeCorection : -1.0,
	  skalar : 0.0,
	  useBumps : false
   };
   var skyPer = { 
	  model : skymodel
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
      target[1] = Math.sin(clock * eyeSpeed) * 4.0;
      target[2] = Math.cos(clock * eyeSpeed) * 4.0;

      // Setup global WebGL rendering behavior.
      gl.enable(gl.BLEND);
      gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
      gl.colorMask(true, true, true, true);
      gl.depthMask(true);
      gl.clearColor(0.5, 0.5, 0.5, 1.0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);

      // Calculate the perspective projection matrix.
      mat4.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 20, projection);
      //mat4.multiply(projection, view, viewProjection);

      // Calculate the viewing transfomation.

      mat4.identity(skyPer.model);
      
      skybox.drawPrep(skyConst);
      skybox.draw(skyPer);
      
      // Prepare rendering of toruss.
      torusConst.time = clock;
      torusConst.useBumps = useBumps;

      //mat4.translate(mat4.identity(torusPer.model), [ 0, 0, 0 ]);
      mat4.scale(mat4.identity(torusPer.model), [ 1.0, 1.0, 1.0 ]);
      mat4.multiply(torusPer.model, objectRotationMatrix);

      torus.drawPrep(torusConst);
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

     mat4.multiply(newRotationMatrix, objectRotationMatrix, objectRotationMatrix);

     lastMouseX = newX
     lastMouseY = newY;
   }
   
   function degToRad(degrees) {
      return degrees * Math.PI / 100;
   }
}
