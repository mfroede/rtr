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
	var textures = {
			env: tdl.textures.loadTexture("textures/earth-2k-land-ocean-noshade.png"),
	};

	var framebuffer = tdl.framebuffers.createFramebuffer(window.canvas.width, window.canvas.height, true);
	var backbuffer = new tdl.framebuffers.BackBuffer(canvas);

	var quadTextures = {
		colorBuffer: framebuffer.texture,
		depthBuffer: framebuffer.depthTexture
	};

	$('window').resize(function() {
		framebuffer = tdl.framebuffers.createFramebuffer(canvas.width, canvas.height, true);
		quadTextures.colorBuffer = framebuffer.texture;
		quadTextures.depthBuffer = framebuffer.depthTexture;
	});
	$('window').resize();

	var frag = window.location.hash.substring(1);
	var pnum = frag ? parseInt(frag) : 0;

	var torusmodel = tdl.primitives.createSphere(0.45, 60, 60);
	tdl.primitives.addTangentsAndBinormals(torusmodel);
	var torus = new tdl.models.Model(programs[pnum], torusmodel, textures);

	var circleTexture = false;
	var lightPosition = vec3.create([10.0,10.0,0.0]);
	var lightIntensity = vec3.create([1,1,1]);

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
			var newmodel = tdl.primitives.createCube(0.75);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
		} else if (key == "x") {
			var newmodel = tdl.primitives.createTorus(0.3, 0.15, 60, 60);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
		} else if (key == "c") {
			var newmodel = tdl.primitives.createSphere(0.45, 60, 60);
			tdl.primitives.addTangentsAndBinormals(newmodel);
			torus.setBuffers(newmodel, textures);
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
		} else if (key == "S") {
			mat4.identity(viewTransformMatrix);
			mat4.rotate(viewTransformMatrix, degToRad(1), [1, 0, 0]);
			mat4.multiply(viewTransformMatrix, view, view);
		} else if (key == "A") {
			mat4.identity(viewTransformMatrix);
			mat4.rotate(viewTransformMatrix, degToRad(-1), [0, 1, 0]);
			mat4.multiply(viewTransformMatrix, view, view);
		} else if (key == "D") {
			mat4.identity(viewTransformMatrix);
			mat4.rotate(viewTransformMatrix, degToRad(1), [0, 1, 0]);
			mat4.multiply(viewTransformMatrix, view, view);
		}
	};

	// Create some matrices and vectors now to save time later.
	var projection = mat4.create();
	var view = mat4.create();
	mat4.lookAt(eyePosition, target, up, view);
	var model = mat4.create();

	// Uniforms for lighting.
	var color = vec3.create([1.0,0.0,0.0]);

	// Uniform variables that are the same for all torus in one frame. 
	var torusConst = {
			view : view,
			projection : projection,
			lightPosition : lightPosition,
			lightIntensity : lightIntensity
	};

	// Uniform variables that change for each torus in a frame.
	var torusPer = {
			model : model,
			color : color
	};

	var screen = Entity.createQuad(programs[1], quadTextures);	
	Entity.loadProgramFromUrl('pass2.vs', 'pass2.fs', [screen]);
	
	var monitor = new Monitor(programs, [framebuffer.texture, framebuffer.depthTexture]);

	var showMonitor = false;
	window.addEventListener('keypress', function(event) {
		if (String.fromCharCode(event.which) == 'm')
			showMonitor = !showMonitor;
	});

	// Renders one frame and registers itself for the next frame.
	function render() {
		tdl.webgl.requestAnimationFrame(render, canvas);

		// Setup global WebGL rendering behavior.
		gl.enable(gl.BLEND);
		gl.viewport(0, 0, canvas.width, canvas.width * 0.6);
		gl.colorMask(true, true, true, true);
		framebuffer.bind();
		gl.depthMask(true);
//		gl.clearColor(0.5, 0.5, 0.5, 1.0);
//		gl.clearDepth(1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// Calculate the perspective projection matrix.
		mat4.perspective(60, canvas.clientWidth / canvas.clientHeight, 0.1, 20, projection);

		mat4.scale(mat4.identity(torusPer.model), [ 1.0, 1.0, 1.0 ]);
		mat4.multiply(torusPer.model, objectRotationMatrix);

		torus.drawPrep(torusConst);
		torus.draw(torusPer);
		
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
