var Sphere = function(gl, depth) {
   this.gl = gl;
   this.depth = depth;

   this.vertices = [];
   this.colors = [];

   this.vertexPositionBuffer;
   this.colorvertexColorBuffer;
}

Sphere.prototype.normalisedMiddle = function(a, b) {
   var c = [ (a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0, (a[2] + b[2]) / 2.0 ];
   vec3.normalize(c);
   return c;
};

Sphere.prototype.configVertices = function(depth, a, b, c) {
   if (depth == 0) {
      this.addVertex(a, b, c)
      this.addColor(a, b, c);
      return;
   }

   var ab = this.normalisedMiddle(a, b);
   var bc = this.normalisedMiddle(b, c);
   var ca = this.normalisedMiddle(c, a);

   this.configVertices(depth - 1, ab, a, ca);
   this.configVertices(depth - 1, ab, b, bc);
   this.configVertices(depth - 1, bc, c, ca);
   this.configVertices(depth - 1, ab, bc, ca);
}

Sphere.prototype.addVertex = function(a, b, c) {
   this.vertices.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}

Sphere.prototype.addColor = function(a, b, c) {
   this.colors.push(
         0.5 + (a[0] * 0.5), 0.5 + (a[1] * 0.5), 0.5 + (a[2] * 0.5), 1.0, 
         0.5 + (b[0] * 0.5), 0.5 + (b[1] * 0.5), 0.5 + (b[2] * 0.5), 1.0, 
         0.5 + (c[0] * 0.5), 0.5 + (c[1] * 0.5), 0.5 + (c[2] * 0.5), 1.0);
}

Sphere.prototype.initBuffers = function() {

   var positonA = [ -1.0, -1.0, 1.0 ];
   var positonB = [ 1.0, -1.0, -1.0 ];
   var positonC = [ -1.0, 1.0, -1.0 ];
   var positonD = [ 1.0, 1.0, 1.0 ];

   vec3.normalize(positonA);
   vec3.normalize(positonB);
   vec3.normalize(positonC);
   vec3.normalize(positonD);

   this.configVertices(this.depth, positonA, positonB, positonC);
   this.configVertices(this.depth, positonA, positonB, positonD);
   this.configVertices(this.depth, positonA, positonC, positonD);
   this.configVertices(this.depth, positonC, positonD, positonB);

   this.vertexPositionBuffer = this.gl.createBuffer();
   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
   this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
   this.vertexPositionBuffer.itemSize = 3;
   this.vertexPositionBuffer.numItems = this.vertices.length / this.vertexPositionBuffer.itemSize;

   this.colorvertexColorBuffer = this.gl.createBuffer();
   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
   this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);
   this.colorvertexColorBuffer.itemSize = 4;
   this.colorvertexColorBuffer.numItems = this.colors.length / this.colorvertexColorBuffer.itemSize;
}

Sphere.prototype.draw = function() {

   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
   this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize,
         this.gl.FLOAT, false, 0, 0);

   this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
   this.gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorvertexColorBuffer.itemSize, this.gl.FLOAT,
         false, 0, 0);

   setMatrixUniforms();
   this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);
}
