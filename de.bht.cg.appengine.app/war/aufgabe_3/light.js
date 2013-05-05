   var Light = function(position, color) {
      this.position = position;
      this.color = color;
   }
   
   function createLightPositions(lights) {
      var result = [];
      for ( var i = 0; i < 4; i++) {
         if (lights[i]) {
            result.push(lights[i].position[0]);
            result.push(lights[i].position[1]);
            result.push(lights[i].position[2]);
         } else {
            result.push(0);
            result.push(0);
            result.push(0);
         }
      }
      return result;
   }

   function createLightIntensities(lights) {
      var result = [];
      for ( var i = 0; i < 4; i++) {
         if (lights[i]) {
            result.push(lights[i].color[0]);
            result.push(lights[i].color[1]);
            result.push(lights[i].color[2]);
         } else {
            result.push(0);
            result.push(0);
            result.push(0);
         }
      }
      return result;
   }