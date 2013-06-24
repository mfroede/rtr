var Camera = function(position, arcX, arcY) {
	this.position = vec3.create([0.0, 1.0, 15.0]);
	this.arcX = -10.0;
	this.arcY = 0.0;
	this.turnspeed = 2.0;
	this.runspeed = 0.2;
	this.fw = false;
	this.bw = false;
	this.l = false;
	this.r = false;

	this.lookLeft = false;
	this.lookRight = false;
	this.lookDown = false;
	this.lookUp = false;
}

Camera.prototype.getTransformationMatrix = function(view) {
	var result = mat4.create();
	mat4.identity(result);

	if(this.lookLeft) {
		this.arcY += this.turnspeed;
	}
	if(this.lookRight) {
		this.arcY -= this.turnspeed;
	}
	if(this.lookDown) {
		this.arcX -= this.turnspeed;
	}
	if(this.lookUp) {
		this.arcX += this.turnspeed;
	}
	var cos = Math.cos(this.arcY * Math.PI / 180.0);
	var sin = Math.cos(this.arcY * Math.PI / 180.0);
	var sinneg =  Math.cos((this.arcY - 90.0) * Math.PI / 180.0);

	if(this.fw) {
		this.position[0] -= sinneg * this.runspeed; 
		this.position[2] -= sin * this.runspeed;
	}
	if(this.bw) {
		this.position[0] += sinneg * this.runspeed; 
		this.position[2] += sin * this.runspeed;
	}
	if(this.r) {
		this.position[2] -= sinneg * this.runspeed; 
		this.position[0] += sin * this.runspeed;
	}
	if(this.l) {
		this.position[2] += sinneg * this.runspeed; 
		this.position[0] -= sin * this.runspeed;
	}

	
	mat4.translate(result, this.position);

	mat4.rotate(result, this.arcY * Math.PI / 180.0, [0,1,0]);
	mat4.rotate(result, this.arcX * Math.PI / 180.0, [1,0,0]);

	result = mat4.inverse(result);

	return result;
}