
var Sphere = function (gl, depth) {
    this.gl = gl;
    this.depth = depth;

    this.vertexPositionBuffer;
    this.colorvertexColorBuffer;
} 


Sphere.prototype.initBuffers = function() {
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);

    var positonA = [-1.0,-1.0, 1.0];
    var positonB = [ 1.0,-1.0,-1.0];
    var positonC = [-1.0, 1.0,-1.0];
    var positonD = [ 1.0, 1.0, 1.0];
    var normPositonA = []; 
    var normPositonB = []; 
    var normPositonC = []; 
    var normPositonD = []; 


    vec3.normalize(positonA, normPositonA); 
    vec3.normalize(positonB, normPositonB); 
    vec3.normalize(positonC, normPositonC);
    vec3.normalize(positonD, normPositonD); 


    var vertices = [
        // Front face
         normPositonA[0],normPositonA[1],normPositonA[2],
         normPositonB[0],normPositonB[1],normPositonB[2],
         normPositonC[0],normPositonC[1],normPositonC[2],

         normPositonA[0],normPositonA[1],normPositonA[2],
         normPositonB[0],normPositonB[1],normPositonB[2],
         normPositonD[0],normPositonD[1],normPositonD[2],

         normPositonC[0],normPositonC[1],normPositonC[2],
         normPositonB[0],normPositonB[1],normPositonB[2],
         normPositonD[0],normPositonD[1],normPositonD[2],

         normPositonC[0],normPositonC[1],normPositonC[2],
         normPositonA[0],normPositonA[1],normPositonA[2],
         normPositonD[0],normPositonD[1],normPositonD[2]
    ];
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = 12;

    this.colorvertexColorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
    var colors = [
        // Front face
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,

        // Right face
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,

        // Back face
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        // Left face
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
    this.colorvertexColorBuffer.itemSize = 4;
    this.colorvertexColorBuffer.numItems = 16;
}

Sphere.prototype.draw = function(){
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    mvPushMatrix();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorvertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);

}