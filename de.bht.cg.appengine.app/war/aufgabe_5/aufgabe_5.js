//Required TDL modules.
tdl.require('tdl.programs');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.textures');
tdl.require('tdl.framebuffers');

//Loads all shader programs from the DOM and return them in an array.
function createProgramsFromTags() {
	var vs = $('script[id^="vs"]');
	var fs = $('script[id^="fs"]');
	var programs = [];
	for ( var i = 0; i != vs.length; i++)
		programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text);
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

//Recalculate per face normals for a triangle mesh.
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

//The main entry point.
function initialize() {
	// Setup the canvas widget for WebGL.
	window.canvas = document.getElementById("canvas");
	window.gl = tdl.webgl.setupWebGL(canvas);
	gl.blendFunc(gl.SRC_COLOR, gl.DST_ALPHA);

	// Create the shader programs.
	var programs = createProgramsFromTags();

	var mouseDown = false;
	var lastMouseX = null;
	var lastMouseY = null;

	var processView = false;

	var objectRotationMatrix = mat4.create();
	mat4.identity(objectRotationMatrix);
	window.canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;

	var framebuffer = tdl.framebuffers.createFramebuffer(window.canvas.width, window.canvas.height, true);
	var backbuffer = new tdl.framebuffers.BackBuffer(canvas);

	var shadowbuffer = [];
	shadowbuffer.push(tdl.framebuffers.createFramebuffer(4096, 4096, true));
	shadowbuffer.push(tdl.framebuffers.createFramebuffer(4096, 4096, true));
	shadowbuffer.push(tdl.framebuffers.createFramebuffer(4096, 4096, true));
	shadowbuffer.push(tdl.framebuffers.createFramebuffer(4096, 4096, true));

	var quadTextures = {
		colorBuffer: framebuffer.texture,
		depthBuffer: framebuffer.depthTexture
	};

	// Load textures.
	var textures = {
		env: tdl.textures.loadTexture("textures/blank_floor.png"),
		shadowMap : shadowbuffer[0].depthTexture
	};
	var groundTextures = {
		env: tdl.textures.loadTexture("textures/blank_floor.png"),
		shadowMap: shadowbuffer[0].depthTexture
	};

	var frag = window.location.hash.substring(1);
	var pnum = frag ? parseInt(frag) : 0;

	var obj3model = tdl.primitives.createCube(0.75);
	var obj3 = new tdl.models.Model(programs[pnum], obj3model, textures);
	var cubeRotX = 0.0;
	var cubeRotY = 0.0;

	var obj2model = tdl.primitives.createSphere(0.45, 60, 60);
	var obj2 = new tdl.models.Model(programs[pnum], obj2model, textures);

	var torusmodel = tdl.primitives.createTorus(0.4, 0.15, 60, 60);
	tdl.primitives.addTangentsAndBinormals(torusmodel);
	var torus = new tdl.models.Model(programs[pnum], torusmodel, textures);
	
	var floorModel = tdl.primitives.createPlane(30,30, 1, 1);
	var floor = new tdl.models.Model(programs[pnum], floorModel, groundTextures);

	var cylinderModel = tdl.primitives.createCylinder(0.45, 2.0, 60, 60);
	var cylinder = new tdl.models.Model(programs[pnum], cylinderModel, textures);

	var showMonitor = false;
	var lightPosition = vec3.create([0.0,3.0,0.0]);
	var lightIntensity = vec3.create([1,1,1]);

	var cameraY = 0.0;
	var camera = new Camera(vec3.create([0.0, 3.0, 10.0]), -30.0, 0.0);

	var diffuseConst = document.getElementById("diffuse").value/100;

	var readLights = function() {
		function stringToArray(string, defaulted) {
			if(!string.match(/-?([0-9]*)\s*,\s*-?([0-9]*)\s*,\s*-?([0-9]*)\s?/)) {
				return [1,1,1];
			}
			var arr = string.split(',');
			var x = arr[0].trim();
			var y = arr[1].trim();
			var z = arr[2].trim();
			return [x, y, z];
		};

		lights = [];
		for(var i = 0; i < 4; i++) {
			if(document.getElementById("light_" + i).checked) {
				var x = document.getElementById("light_" + i + "_x").value/10;
				var y = document.getElementById("light_" + i + "_y").value/10;
				var z = document.getElementById("light_" + i + "_z").value/10;

				var arcX = -90.0;
				var arcY = 0.0;
				lights.push(new Light([x,y,z], stringToArray(document.getElementById("light_" + i + "_i").value), arcX, arcY));
			}
		}
		lightPosition = vec3.create(lights[0].position);
		lightIntensity = vec3.create(lights[0].color);
	}

	readLights();

	for(var i = 0; i < 4; i++) {
		document.getElementById("light_" + i).onchange=readLights;
		document.getElementById("light_" + i + "_x").onchange=readLights;
		document.getElementById("light_" + i + "_y").onchange=readLights;
		document.getElementById("light_" + i + "_z").onchange=readLights;
		document.getElementById("light_" + i + "_i").onchange=readLights;
	}
	document.getElementById("diffuse").onchange=function() {
		diffuseConst = document.getElementById("diffuse").value/100;
	};

	window.onkeydown = function() {
		var key = String.fromCharCode(event.which);
		if (key == "W") {
			camera.fw = true;
		} else if (key == "A") {
			camera.l = true;
		} else if (key == "S") {
			camera.bw = true;
		} else if (key == "D") {
			camera.r = true;
		} else if (key == "E") {
			camera.up = true;
		} else if (key == "Q") {
			camera.down = true;
		}
	}
	window.onkeyup = function() {
		var key = String.fromCharCode(event.which);
		if (key == "W") {
			camera.fw = false;
		} else if (key == "A") {
			camera.l = false;
		} else if (key == "S") {
			camera.bw = false;
		} else if (key == "D") {
			camera.r = false;
		} else if (key == "E") {
			camera.up = false;
		} else if (key == "Q") {
			camera.down = false;
		}
	}

	function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }

  function canvasMouseMove(evt) {
	    var mousePos = getMousePos(canvas, evt);
	    // console.log('Mouse position: ' + mousePos.x + ',' + mousePos.y);
	    if(mousePos.x > 200) {
	    	camera.lookLeft = false;
	    }
	    if(mousePos.x < 1000) {
	    	camera.lookRight = false;
	    }
	    if(mousePos.y < 550) {
	    	camera.lookDown = false;
	    }
	    if(mousePos.y > 150) {
	    	camera.lookUp = false;
	    }
  		if(!processView) {
			return;
		}
	    if(mousePos.x <= 200) {
	    	camera.lookLeft = true;
	    }
	    if(mousePos.x >= 1000) {
	    	camera.lookRight = true;
	    }
	    if(mousePos.y >= 550) {
	    	camera.lookDown = true;
	    }
	    if(mousePos.y <= 150) {
	    	camera.lookUp = true;
	    }
	  }

	canvas.onmouseover= function(evt) {
		canvas.addEventListener('mousemove', canvasMouseMove, false);
	};
	canvas.onmouseout = function(evt) {
		canvas.removeEventListener('mousemove', canvasMouseMove);
		camera.fw = false;
		camera.bw = false;
		camera.l = false;
		camera.r = false;

    	camera.lookLeft = false;
    	camera.lookRight = false;
    	camera.lookDown = false;
    	camera.lookUp = false;
	};

	// Register a keypress-handler for shader program switching using the number
	// keys.
	window.onkeypress = function(event) {
		var key = String.fromCharCode(event.which);
		if (key == "y") {
			var newmodel = tdl.primitives.createCube(0.75);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
		} else if (key == "x") {
			var newmodel = tdl.primitives.createTorus(0.4, 0.15, 60, 60);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
		} else if (key == "c") {
			var newmodel = tdl.primitives.createSphere(0.45, 60, 60);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
		}else if (key == 'm') {
			showMonitor = !showMonitor;
		} else if (key == "b") {
			processView = !processView;
		}	
	};

	// Create some matrices and vectors now to save time later.
	var projection = mat4.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 200, projection);
	
	var view = mat4.identity();
	mat4.multiply(view, camera.getTransformationMatrix());
	var model = mat4.create();
	var model2 = mat4.create();
	var floorModel = mat4.create();
	var cubeModel = mat4.create();
	var cylinderModel = mat4.create();
	var shadowView = mat4.identity();
	var shadowprojection = mat4.identity();
	// Uniforms for lighting.
	var color = vec3.create([1.0,0.0,0.0]);


	// Uniform variables that are the same for all torus in one frame. 
	var torusConst = {
		view : view,
		projection : projection,
		lightPosition : lightPosition,
		lightIntensity : lightIntensity,
		lightSourceProjectionMatrix : shadowprojection,
		lightSourceViewMatrix : shadowView,
		diffuseConst : diffuseConst
	};

	// Uniform variables that change for each torus in a frame.
	var torusPer = {
		model : model
	};

	var torus2Per = {
		model : model2
	};

	var cubePer = {
		model : cubeModel
	};

	var floorPer = {
		model : floorModel
	};

	var cylinderPer = {
		model : cylinderModel
	};

	mat4.translate(mat4.identity(floorPer.model), [0.0, -5.0, 0.0]);
	mat4.translate(mat4.identity(torusPer.model), [0.0, 0.0, 0.0]);
	mat4.translate(mat4.identity(torus2Per.model), [2.0, 0.0, 0.0]);
	

	var screen = Entity.createQuad(programs[1], quadTextures);	
	Entity.loadProgramFromUrl('pass2.vs', 'pass2.fs', [screen]);
	
	var monitor = new Monitor(programs, [framebuffer.texture, shadowbuffer[3].depthTexture]);

	function render() {
		mat4.multiply(mat4.identity(view), camera.getTransformationMatrix());

		cubeRotX += 1;
		cubeRotY += 1;
		mat4.translate(mat4.identity(cubeModel), [-2.0, 0.0, 0.0]);
		mat4.rotateY(cubeModel, cubeRotY * Math.PI / 180.0);
		mat4.rotateX(cubeModel, cubeRotX * Math.PI / 180.0);

		tdl.webgl.requestAnimationFrame(render, canvas);
		torus.setProgram(programs[3]);
		obj2.setProgram(programs[3]);
		obj3.setProgram(programs[3]);
		floor.setProgram(programs[3]);
		cylinder.setProgram(programs[3]);
		framebuffer.bind();
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.BLEND);
		gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
		gl.colorMask(true, true, true, true);
		gl.depthMask(true);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		torusConst.diffuseConst = diffuseConst;
		drawScene();
		for (var i = 0; i < lights.length; i++) {
			if(lights[i]){
				lightPosition = vec3.create(lights[i].position);
				lightIntensity = vec3.create(lights[i].color);
				textures.shadowMap = shadowbuffer[i].depthTexture;
				groundTextures.shadowMap = shadowbuffer[i].depthTexture;
				renderShadowMap(i);
				renderScene();
			}
		}
		finishRender();
	}

	// Renders one frame and registers itself for the next frame.
	function renderShadowMap(i) {

		torus.setProgram(programs[0]);
		obj2.setProgram(programs[0]);
		obj3.setProgram(programs[0]);
		floor.setProgram(programs[0]);
		cylinder.setProgram(programs[0]);

		// Setup global WebGL rendering behavior.
		gl.enable(gl.BLEND);
		gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
		gl.colorMask(true, true, true, true);
		
		shadowbuffer[i].bind();
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		torusConst.lightPosition = lightPosition;
		torusConst.lightIntensity = lightIntensity;

		mat4.multiply(mat4.identity(shadowView), getCameraTransformationMatrix(lightPosition, lights[i].arcX, lights[i].arcY));
		torusConst.view = shadowView;
		mat4.perspective(2024, canvas.clientWidth / canvas.clientHeight, lightPosition[1] - 1.5, lightPosition[1] + 20.0, shadowprojection);
		torusConst.projection = shadowprojection;
		torusConst.lightSourceViewMatrix = shadowView;
		torusConst.lightSourceProjectionMatrix = shadowprojection;

		drawScene();
	}

// Renders one frame and registers itself for the next frame.
function renderScene() {

	torus.setProgram(programs[1]);
	obj2.setProgram(programs[1]);
	obj3.setProgram(programs[1]);
	floor.setProgram(programs[1]);
	cylinder.setProgram(programs[1]);

		// Setup global WebGL rendering behavior.
		gl.enable(gl.BLEND);
		gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
		gl.colorMask(true, true, true, true);
		
		framebuffer.bind();
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		
		torusConst.view = view;
		torusConst.projection = projection;

		drawScene();
	}


	function finishRender() {
		backbuffer.bind();
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);
		screen.draw();

		if (showMonitor) {
			monitor.draw();
		}
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
		mat4.identity(objectRotationMatrix);
	}

	function handleMouseMove(event) {
		var newX = event.clientX;
		var newY = event.clientY;
		var deltaX = newX - lastMouseX;
		var deltaY = newY - lastMouseY;
		if (mouseDown) {
			var newRotationMatrix = mat4.create();
			mat4.identity(newRotationMatrix);
			mat4.rotate(newRotationMatrix, degToRad(deltaX / 50), [0, 0, 1]);
			mat4.rotate(newRotationMatrix, degToRad(deltaY / 50), [1, 0, 0]);
			mat4.multiply(newRotationMatrix, objectRotationMatrix, objectRotationMatrix);
			mat4.multiply(torusPer.model, objectRotationMatrix);
		}
		lastMouseX = newX
		lastMouseY = newY;
	}

	function degToRad(degrees) {
		return degrees * Math.PI / 180.0;
	}

	function setUpLights() {
		lights = [];
		for(var i = 0; i < 4; i++) {
			if(document.getElementById("light_" + i).checked) {
				var x = document.getElementById("light_" + i + "_x").value;
				var y = document.getElementById("light_" + i + "_y").value;
				var z = document.getElementById("light_" + i + "_z").value;
				lights.push(new Light([x,y,z],stringToArray(document.getElementById("light_" + i + "_i").value)));
			}
		}
		return lights;
	} 

	function getCameraTransformationMatrix(translate, rotateX, rotateY){
		var result = mat4.create();
		mat4.identity(result);
		mat4.translate(result, translate);
		mat4.rotate(result, degToRad(rotateY), [0,1,0]);
		mat4.rotate(result, degToRad(rotateX), [1,0,0]);
		return mat4.inverse(result);
	}

	function drawScene() {

		torus.drawPrep(torusConst);
		torus.draw(torusPer);
		obj2.drawPrep(torusConst);
		obj2.draw(torus2Per);
		obj3.drawPrep(torusConst);
		obj3.draw(cubePer);
		
		mat4.translate(mat4.identity(cylinderPer.model), [2.5, -4.0, 2.5]);
		cylinder.drawPrep(torusConst);
		cylinder.draw(cylinderPer);

		mat4.translate(mat4.identity(cylinderPer.model), [-2.5, -4.0, -2.5]);
		cylinder.drawPrep(torusConst);
		cylinder.draw(cylinderPer);

		mat4.translate(mat4.identity(cylinderPer.model), [2.5, -4.0, -2.5]);
		cylinder.drawPrep(torusConst);
		cylinder.draw(cylinderPer);

		mat4.translate(mat4.identity(cylinderPer.model), [-2.5, -4.0, 2.5]);
		cylinder.drawPrep(torusConst);
		cylinder.draw(cylinderPer);


		floor.drawPrep(torusConst);
		floor.draw(floorPer);
	}
}
